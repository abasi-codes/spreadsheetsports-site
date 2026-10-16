# spreadsheetsports.com

Static site (plain HTML/CSS/JS, no build step). Every number comes from the real model outputs.

## Run locally
    python3 -m http.server 8790   # then open http://127.0.0.1:8790

## Update the numbers
    python3 tools/export_data.py  # re-reads ~/mvp-video, ~/title-video, ~/underrated, ~/cursed-video → data/*.json
New videos: add a row to `data/videos.json` (`kind`: Model / Film Breakdown / Documentary; `publishAt` hides a scheduled video until it's public).

## Structure
- `index.html` home · `models/*.html` model pages · `videos.html` · `report-card.html` · `404.html`
- `assets/css/site.css` design system · `assets/js/site.js` shared (nav, bars, tables, search, embeds) · `curse.js` player breakdown · `home.js`
- `tools/og.html` → `assets/img/og.png` share image (render with headless Chrome at 1200×630)

## Deploy (recommended: Cloudflare Pages, free)
1. Push this folder to a GitHub repo.
2. Cloudflare Pages → Create project → connect repo → framework "None", build command empty, output dir `/`.
3. Custom domain → spreadsheetsports.com (point the domain's nameservers to Cloudflare, or add the CNAME it gives you).
Netlify / Vercel work the same way (static, no build).

## Newsletter
Set `NEWSLETTER_ACTION` in `assets/js/site.js` to your provider's form URL (Buttondown, Beehiiv, ConvertKit) to switch the signup on.

## Data note
Historical stats are from Basketball-Reference and are used here only as inputs to our own models (rankings, percentiles, model odds). A full raw stats database would need a licensed source.
