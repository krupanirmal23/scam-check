# Success metric and guardrails

**Status:** provisional, dated 11 November 2026. Targets marked *provisional* were set from the synthetic rehearsal and **must be re-set from real discovery and re-dated before launch.**

## Which mistake is worse?

A **missed scam** (no warning on a scam) is worse than a **false alarm**, because a person who checked may feel more confident and go ahead. So the checker leans cautious, and its mildest verdict is "no common warning signs found", never "safe".

False alarms still get a hard cap. P07 (bank branch, synthetic) put it this way: "if a website says 'safe' and it was wrong, they will blame it". A checker that cries wolf gets ignored too.

## Metrics

| Metric | Definition | Target | Why this number |
|---|---|---|---|
| North star: checks that helped | Share of checks with feedback where the user taps "Yes" to "Did this help you decide?" | [__]% | Set after real discovery |
| Weekly checks | `verdict` events per week | [__] | Set after soft launch |
| Repeat users | Visitors (random browser ID) with a second check within [__] days | [__]% | Set after real discovery |
| Feedback rate | Share of checks with any feedback tap | [__]% | Set after soft launch |
| **Guardrail: missed scams** | Held-out eval: scams with no warning | **≤ 10%** *(provisional)* | Leans cautious; tighten once a real held-out set exists |
| **Guardrail: false alarms** | Held-out eval: genuine messages flagged | **≤ 10%** *(provisional)*, also reported for bank/OTP messages | High enough to allow caution, low enough that warnings keep meaning something |
| Guardrail: privacy | Message text stored without opt-in | **0** | Non-negotiable |
| Guardrail: speed | Median time to a verdict (rules) | ≤ 1 s | Rules run in ~1 ms; the budget leaves room for slow phones |

The launch bar lives in [`eval/launch_bar.json`](../eval/launch_bar.json); `npm run eval` checks it.

## Events (never message text)

| Event | Recorded |
|---|---|
| `visit` | source tag (`?src=`), date |
| `check` | length bucket, language guess, source |
| `verdict` | verdict, rules fired, unsure yes/no, ms |
| `link_check` | number of unsafe matches |
| `feedback` | helped yes/no, verdict |
| `wrong` | verdict, rules fired |
| `next_step` | which help link was tapped (1930, cybercrime, Chakshu, PIB) |
| `share` | verdict |

Each event carries a random browser ID for return visits, disclosed in the privacy note. Events go out only if `analyticsUrl` is set in `src/config.js`.

## Known weakness

"Helped me decide" is self-reported, and early users will mostly be people who know Krupa. The case study must say both.
