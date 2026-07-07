# bevo-landing

Static landing page for VirtualsApp (`bevo-app`) — "Social and execute in
one place" — with a waitlist / early-access CTA. Content and section
structure reference the staging landing page
(virtualsapplandingpage-staging.up.railway.app): hero, waitlist rewards,
Why VirtualsApp (Butler / marketplace / crew), agent ecosystem examples,
how-it-works steps + stats, waitlist CTA.

No build step, no dependencies: plain HTML/CSS/JS mirroring the app's design
language (`bevo-app/lib/theme/app_theme.dart`):

- `virtuals` theme palette — dark neutral background, teal-green accent,
  green→teal gradient.
- Instrument Serif italic for headline moments + Inter body + uppercase
  eyebrow labels, matching `AppTheme.serif` / `AppTheme.eyebrow`.
- The Butler mark (`assets/butler.svg`, copied from
  `bevo-app/assets/images/BUTLER.svg`) and a CSS take on the breathing
  `ButlerOrb`.
- Copy follows the app's onboarding voice ("By invitation.", "Welcome in.",
  "At your service.").

## Run locally

```bash
open index.html            # or any static server:
python3 -m http.server 8080
```

## Wire up the waitlist (collect emails into a Google Sheet)

Signups append rows to a Google Sheet via a Google Apps Script web app.
One-time setup (~2 minutes):

1. Create a new Google Sheet (e.g. "VirtualsApp Waitlist").
2. In the sheet: **Extensions ▸ Apps Script**, replace the default code
   with the contents of [`waitlist-apps-script.gs`](waitlist-apps-script.gs),
   and save.
3. **Deploy ▸ New deployment ▸ Web app**, with *Execute as: Me* and
   *Who has access: Anyone*, then authorize when prompted.
4. Copy the Web app URL (ends in `/exec`) into `WAITLIST_ENDPOINT` at the
   top of `main.js` and redeploy the page.

Each signup lands as a `Timestamp | Email | Source` row on a "Waitlist"
tab (duplicates are skipped). The page posts JSON with a `text/plain`
content type to avoid the CORS preflight Apps Script can't answer.

Until the endpoint is set, the form shows the success state locally
without storing anything.

## Deploy

It's a static folder — drop it on any static host (Vercel, Netlify, Railway
static site, S3/CloudFront, GitHub Pages).
