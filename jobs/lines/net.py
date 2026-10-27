"""Polite JSON fetcher shared by the Lines job (stdlib only).

- One request at a time, at least GAP seconds apart per host.
- Timeouts, bounded retries with exponential backoff on 5xx / network errors.
- Hard stop (raises Blocked) on 403/429 or a non-JSON body: we never retry around a block.
"""
import json
import time
import urllib.error
import urllib.request
from urllib.parse import urlparse

UA = "spreadsheetsports-lines/1.0"
GAP = {"site.api.espn.com": 0.8, "api-web.nhle.com": 1.0}
TIMEOUT = 25
RETRIES = 3

_last = {}
stats = {"requests": 0, "errors": 0}


class Blocked(RuntimeError):
    """The API refused us (403/429/HTML). Stop the whole run and keep the last good data."""


def get_json(url):
    host = urlparse(url).netloc
    gap = GAP.get(host, 1.0)
    for attempt in range(RETRIES + 1):
        wait = gap - (time.time() - _last.get(host, 0))
        if wait > 0:
            time.sleep(wait)
        _last[host] = time.time()
        stats["requests"] += 1
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                body = r.read()
                ctype = r.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                raise Blocked(f"HTTP {e.code} on {url}")
            if e.code == 404:
                return None
            stats["errors"] += 1
            if attempt == RETRIES:
                raise
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            stats["errors"] += 1
            if attempt == RETRIES:
                raise RuntimeError(f"network error on {url}: {e!r}")
        else:
            if "json" not in ctype and body[:1] not in (b"{", b"["):
                raise Blocked(f"non-JSON response ({ctype}) on {url}: {body[:80]!r}")
            return json.loads(body)
        time.sleep(2 ** (attempt + 1))
    return None
