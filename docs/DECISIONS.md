# Decisions

Newest first. Each entry: decision, options considered, why, what would change my mind.

---

### 2026-11-11 · Link check runs on Cloudflare Workers
**Decision (yours):** host the Safe Browsing lookup on Cloudflare Workers.
**Built:** `server/wrangler.toml`. Only listed origins may call the Worker (others get 403), so a stranger's site can't spend the API quota. The key is a Wrangler secret, and Worker observability/logging is off.
**Verified locally:** `npm run test:server` (Google mocked) covers a known-bad link, only URLs being forwarded, refused origins, a 10-URL cap and a missing key. A browser run against the real Worker code showed a "suspicious" message going up to "likely scam" when its link was reported unsafe, and the mock received only the URLs.
**Not yet done:** a real deploy. That needs Krupa's Cloudflare login and Google API key.

### 2026-11-11 · Electricity cut-off gets its own rule (rules-v1.4)
**Decision:** add `utility_cutoff` (strong).
**Why:** after removing "tonight" from urgency (below), the most common rehearsal scam, "bijli connection aaj raat kaat diya jayega, call this number", dropped from "Likely scam" to "Looks suspicious". Genuine bill messages (G007, G035) don't threaten disconnection, so they stay clean.
**Would change my mind:** real genuine utility messages that do mention disconnection (e.g. scheduled maintenance outages).

### 2026-11-11 · The held-out test set failed, and is now spent
**Decision:** record the failure, fix the rules, and treat the current test split as no longer held out.
**What happened:** the first and only blind test run (rules-v1.1, `results/2026-11-11T03-58-43-976Z-test/`) gave **0% missed scams but 10.3% false alarms (3/29)**, failing the ≤ 10% bar. The causes were "aaj raat" (tonight) firing on a movie plan, "Congratulations" on a genuine ₹25 cashback, and a genuine branch KYC reminder.
**Fixes (rules-v1.2):** drop bare "tonight / aaj raat / आज रात" from urgency, drop bare "congratulations", make KYC a weak sign on its own.
**Consequence:** later runs score 100/100 on all 100 items, but **that number means nothing**. The rules have now been tuned against every item, and every item was written by me. Before launch, build a fresh held-out set from real messages (PIB Fact Check, r/IsThisAScamIndia, volunteers' genuine bank/OTP messages) and report only that.

### 2026-11-11 · Link check: browser rules plus a server lookup
**Decision (yours):** check links in the browser (shorteners, lookalike domains, raw IPs) **and** look them up against Google Safe Browsing through a small server function.
**Options:** browser-only; browser + server; browser now, server later.
**Trade-off accepted:** catches known-bad URLs, but links (not the message) leave the device, it needs hosting and an API key, and a "clean" result proves nothing for new domains. The page says exactly that.
**Built as:** `server/link-check.js`, a standard fetch handler. It's switched off until `linkCheckUrl` is set in `src/config.js`, and the privacy copy changes automatically when it's on.
**Host:** Cloudflare Workers (see the entry above).

### 2026-11-11 · Languages: English, Hinglish and Hindi
**Decision (yours):** rules and interface cover all three, with a one-tap English/हिंदी switch. A message in Hindi or Hinglish gets a "हिंदी में देखें" prompt.
**Note:** this widens the plan's "one language I can test properly" rule. The eval reports results per language so a weak spot can't hide.

### 2026-11-11 · Discovery rehearsed with synthetic personas
**Decision (yours):** run 12 AI-role-played interviews to stress-test the script and hypotheses before real conversations.
**Guardrail:** labelled synthetic everywhere. None of its counts go into posts, the case study or the resume. Real interviews remain step 2's "done when".

### 2026-11-11 · Design: "the red-pen check"
**Decision:** the result shows the user's own message with the warning words underlined in red pen (or highlighted in haldi for softer signs) and numbered to the reasons.
**Why:** discovery kept returning to someone trusted pointing at what's wrong. Helpers (P03, P08) need a concrete "why" to pass on.
**Deliberately not:** green for "no signs" (it would read as "safe"); a stamp-style verdict badge (looks official and could pass for a government seal); a login; a card-grid layout.
**Type:** Tiro Devanagari Hindi for verdicts, Mukta for body, both designed for Devanagari plus Latin. 18 px base.

### 2026-11-11 · Rules before any model
**Decision:** v1 is a transparent rules engine. Every reason is shown, and nothing leaves the phone except optional link lookups.
**Would change my mind:** the real held-out set shows rules missing more scams than the guardrail allows. Then add a model, labelled by name, as the plan says.
