# Nimbus

Static Scramjet proxy frontend. Netlify hosts the shell; the proxy transport runs
over a wisp websocket.

## Deploy

1. Push this repo to GitHub.
2. Netlify → Add new site → Import from GitHub → pick the repo.
3. Build command: `node build.mjs` — Publish directory: `dist`.
4. Deploy.

`netlify.toml` already carries the build settings, COOP/COEP headers (needed for
SharedArrayBuffer), and the service worker scope header.

## Swap the wisp server

Edit `WISP` at the top of `public/app.js`. The default
`wss://wisp.mercurywork.shop/` is a shared public server — fine for personal use,
slower under load. To run your own, deploy
[`wisp-server-node`](https://github.com/MercuryWorkshop/wisp-js) on a small VPS
and point `WISP` at `wss://yourdomain/wisp/`.

## Notes

- `*.netlify.app` is probably already in a filter's proxy category. Attach a cheap
  custom domain (then change the Netlify site name) before you rely on this at school.
- If a proxied site breaks, try `Cross-Origin-Embedder-Policy = "credentialless"`
  in `netlify.toml` instead of `require-corp`.
- Update `PANIC` in `public/app.js` to whatever page your school considers normal.
- AGPL-3.0 dependencies: keep the repo public.