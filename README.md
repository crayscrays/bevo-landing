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

## Wire up the waitlist (collect emails)

Signups are collected via a third-party form endpoint — Formspree by
default. One-time setup:

1. Sign up free at [formspree.io](https://formspree.io) and create a form
   (name it e.g. "VirtualsApp waitlist").
2. Copy the form's endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. Paste it into `WAITLIST_ENDPOINT` at the top of `main.js` and redeploy.

Every signup then appears in the Formspree dashboard (inbox view, CSV
export, optional email/Slack notifications). The form POSTs
`{ "email": "...", "source": "bevo-landing" }` as JSON, so any
Formspree-compatible endpoint (e.g. [web3forms.com](https://web3forms.com))
works too.

Until the endpoint is set, the form shows the success state locally
without storing anything.

## Deploy

It's a static folder — drop it on any static host (Vercel, Netlify, Railway
static site, S3/CloudFront, GitHub Pages).
