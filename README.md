# bevo-landing

Static landing page for VirtualsApp (`bevo-app`) — "Chat, Transact and
Connect globally" — with a waitlist CTA.

No build step, no dependencies: plain HTML/CSS/JS styled after the app's
`virtuals` theme (`bevo-app/lib/theme/app_theme.dart` — dark neutral
background, teal-green accent, green→teal gradient).

## Run locally

```bash
open index.html            # or any static server:
python3 -m http.server 8080
```

## Wire up the waitlist

The form currently succeeds locally without storing anything. Point it at a
real collector by setting `WAITLIST_ENDPOINT` at the top of `main.js`; the
form POSTs `{ "email": "...", "source": "bevo-landing" }` as JSON.

## Deploy

It's a static folder — drop it on any static host (Vercel, Netlify, Railway
static site, S3/CloudFront, GitHub Pages).
