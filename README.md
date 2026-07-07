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

## Wire up the waitlist

The form currently succeeds locally without storing anything. Point it at a
real collector by setting `WAITLIST_ENDPOINT` at the top of `main.js`; the
form POSTs `{ "email": "...", "source": "bevo-landing" }` as JSON.

## Deploy

It's a static folder — drop it on any static host (Vercel, Netlify, Railway
static site, S3/CloudFront, GitHub Pages).
