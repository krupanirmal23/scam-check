# Scam Check

Paste a suspicious SMS, WhatsApp or UPI message and see what looks wrong in it, marked in your own message, and what to do next. English, Hinglish and Hindi.

Checked on your phone. Nothing you paste is stored. Scam Check never says a message is "safe".

A portfolio project by **Krupa Nirmal**, built in public. The product decisions are logged in [docs/DECISIONS.md](docs/DECISIONS.md).

## Status

| Step | State |
|---|---|
| 1. Hypotheses | Written and dated: [docs/HYPOTHESES.md](docs/HYPOTHESES.md) |
| 2. Discovery | **Rehearsed only** with 12 synthetic personas: [docs/DISCOVERY.md](docs/DISCOVERY.md). Real interviews still to do. |
| 3. PRD | Draft: [docs/PRD.md](docs/PRD.md) |
| 4. Metrics | Provisional: [docs/METRICS.md](docs/METRICS.md) |
| 5. MVP | Working web checker (this repo) |
| 6. Eval | Harness works. The current 100 messages are synthetic and have been tuned against, so a real held-out set is needed before launch. |
| 7–9 | Not started |

## Run it

```bash
npm run serve
```

Then open http://localhost:8080. There's no build step and no dependencies; it's plain HTML, CSS and JS.

## Eval

```bash
npm run eval
```

This runs the held-out split and checks the launch bar in `eval/launch_bar.json`. `npm run eval:dev` runs the tuning split and lists every miss. Each run writes `results/<timestamp>/per_item.csv` and `summary.json`.

Eval items live in `eval/messages.jsonl` (`id, label, type, channel, lang, source, text`). Replace the `synthetic-*` items with real, masked messages before launch.

## Layout

```
index.html            the page
src/rules.js          rules engine (browser + Node), masking, language guess
src/app.js            page behaviour, counts-only analytics
src/strings.js        English and Hindi copy
src/styles.css        design tokens and layout
src/config.js         link-check and analytics endpoints (empty = off)
server/link-check.js  Google Safe Browsing lookup, receives links only
eval/                 messages, harness, launch bar
docs/                 hypotheses, discovery, PRD, metrics, decisions
```

## Link check on Cloudflare Workers

`server/link-check.js` looks up the links in a message (never the text) on Google Safe Browsing. It stays off until its URL is in `src/config.js`.

**Test it locally** (Google is mocked; no key or account needed):

```bash
npm run test:server
```

**Deploy:**

1. **Get a Safe Browsing key.** In the [Google Cloud console](https://console.cloud.google.com/), create a project, enable the *Safe Browsing API*, then create an API key. Restrict the key to the Safe Browsing API. Read the usage terms first: free for non-commercial use [S9].
2. **Log in to Cloudflare** (a free account works). This opens your browser:
   ```bash
   cd server && npx wrangler login
   ```
3. **Allow your live site.** In `server/wrangler.toml`, add the site's origin to `ALLOWED_ORIGINS`, e.g. `"http://localhost:8080,https://<username>.github.io"`. Other sites get a 403.
4. **Store the key as a secret.** Paste it when asked. It never goes in a file:
   ```bash
   npx wrangler secret put SAFE_BROWSING_API_KEY
   ```
5. **Deploy.** Wrangler prints the Worker's URL, like `https://scam-check-link-check.<your-subdomain>.workers.dev`:
   ```bash
   npx wrangler deploy
   ```
6. **Switch it on.** Put that URL in `src/config.js` as `linkCheckUrl`. The page's privacy line and note change on their own to say that links are looked up.
7. **Check it.** Google's own test page should come back as unsafe:
   ```bash
   curl -s -X POST https://scam-check-link-check.<your-subdomain>.workers.dev -H "Content-Type: application/json" -d '{"urls":["http://testsafebrowsing.appspot.com/s/phishing.html"]}'
   ```

Check Cloudflare's current free-plan request limits on its pricing page before launch.

## Help numbers used on every result

- 1930, National Cyber Crime Helpline, and [cybercrime.gov.in](https://cybercrime.gov.in) [S1, S2]
- Chakshu at [sancharsaathi.gov.in/sfc](https://sancharsaathi.gov.in/sfc/), within 30 days [S3]
- PIB Fact Check on WhatsApp, +91 8799711259, for Government of India claims [S4]

Re-check each link before launch (plan step 5).
