# Display Reader

A web app for reading on the Meta Ray-Ban Display. Fixed 600 by 600 view, D-pad only, no scrolling. It shows the current sentence in large type with neighbors around it, and reads aloud sentence by sentence.

Live demo: https://johnyoonh.github.io/display-reader/

## What is in this repo

- `index.html`: the whole app in one file. Open it in a browser or host it at a public HTTPS URL.
- `logo.png`: the 80x80 app logo.
- `worker.js` + `wrangler.toml`: the optional CORS proxy for Readwise and RSS (see below).

## Reading

- Two bundled demo texts work with no account; connect Readwise to load your own documents.
- Up and Down move by sentence, Left and Right jump five, Enter plays or pauses read-aloud, Escape goes back.
- Long blocks are split into display-sized pieces at clause boundaries, so nothing overflows the 600 by 600 display.

## Voices

- Glasses voice (default): the glasses built-in speech, works offline.
- Unreal Speech (optional): the same engine behind Readwise Reader's listen feature. Needs a free API key from unrealspeech.com, entered in Settings. Free tier is 250,000 characters a month. Falls back to the glasses voice if a request fails.

## Readwise

- Connect in the app with a Readwise Reader API token to load documents from Reader. Direct browser calls to the Readwise API are blocked by CORS in some browsers, so the app falls back to demo mode with sample texts when the call fails. Preloaded books always work.

## CORS proxy (optional)

Direct browser calls to the Readwise API are blocked by CORS, and most RSS feeds do not send CORS headers either. The app works without a proxy (preloaded books and demo texts always load), but to load your live Readwise library or RSS feeds, deploy the included `worker.js` to your own Cloudflare account (free tier) with `npx wrangler deploy`, then paste the Worker URL into Settings. Your token only ever goes to Readwise and to your own Worker. Set a shared secret with `wrangler secret put PROXY_SECRET` and enter the same value as the Proxy key in Settings to keep the Worker private to you.

## Loading on the glasses

1. Open the live demo above, or host `index.html` at a public HTTPS URL.
2. In the Meta AI app, enable Developer Mode (tap the app version five times).
3. Display Glasses settings, App Connections, Web Apps, Add a Web App, paste the URL.
4. Needs glasses software v125 or later and Meta AI app v272 or later.

## Notes

- This is the public demo version. It contains no book text; the full version with a preloaded book stays in a private repo.
- No API keys are stored in this repo. Keys are entered in the app and kept in the browser's local storage on the device.
