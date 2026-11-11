# Scam Check PRD (v1, draft)

**Owner:** Krupa Nirmal · **Status:** draft based on the [discovery rehearsal](DISCOVERY.md). Every choice marked *(R)* comes from synthetic interviews and must be re-confirmed by real ones.

## Problem

People in India get SMS and WhatsApp messages that threaten them ("connection cut tonight", "account blocked") or tempt them ("earn ₹3,000 daily"). When unsure, they wait for someone they trust, sometimes for hours. In that gap, some of them act on the message.

> "In that gap, people do things. That is the real problem." P08, society secretary *(R)*
> "Bas koi bol de seedha, sach hai ya jhooth." P01, retired clerk *(R)*
> "Whether something is already gone because I opened the message." P10, retired teacher *(R)*

## User

**Someone, often 40+, who reads Hindi or English, gets a threatening or too-good-to-be-true WhatsApp or SMS, and usually waits for a family member or neighbour to tell them if it's real.** *(R)*

Secondary user: the family helper who gets the forward and needs one line of "why" to pass back.

## Scope (v1)

| Choice | v1 | Why |
|---|---|---|
| Channel | Web page, paste in | Cheapest to ship and share as a link (plan step 5) |
| Languages | English, Hinglish, Hindi (Devanagari) | Your decision; Hindi/Hinglish came up in 6 of 12 *(R)* |
| Scam types | KYC/account-block, utility cut-off, job/task offers, plus OTP/PIN requests, PIN-to-receive, remote-access apps | Most frequent in the rehearsal; OTP and PIN patterns from RBI BE(A)WARE [S5] |
| Link check | In-browser lookalike/shortener rules, plus server check against Google Safe Browsing (links only) | Your decision, 11 Nov 2026 |

## Non-goals

- No call screening (even though calls caused most losses described *(R)*)
- No recovering money; we point to 1930 and cybercrime.gov.in
- No scanning phones, SMS inboxes or apps
- **No "safe" verdict, ever**
- No account, login or phone number
- No storing message text (opt-in sharing comes later, and only after review)
- No regional languages beyond Hindi in v1 (Gujarati, Marathi, Bengali and Tamil were noted *(R)*)

## User flow

Paste (or tap an example) → verdict → the message marked up with numbered warning signs → reasons → what to do now → "Did this help you decide?" → send result to family / check another.

## Verdict levels

| Verdict | When | What it says to do |
|---|---|---|
| Likely scam | Any critical sign (asks for OTP/PIN, PIN-to-receive, remote app, known-unsafe link), or score ≥ 5 | Don't tap, don't call, don't share any code |
| Looks suspicious | Score 2–4 | Don't act yet; check through the official app or a number you already have |
| Not sure | Score 1, or a message too short to judge | Too little to go on; be careful |
| No common warning signs found | Score 0 | "That doesn't mean it's safe" |

## Requirements

1. Each reason is shown in plain words, and the matching words are marked in the user's own message.
2. Safety and reporting text on every result: 1930, cybercrime.gov.in, Chakshu, PIB Fact Check, call your bank on the number on your card [S1–S4, S6].
3. Privacy: message checked in the browser and never stored. Numbers are masked in the displayed copy. Links are sent to the lookup only when that's configured, and the page says so next to the input box.
4. Time to verdict: rules under 50 ms on a budget phone; link lookup times out after 5 s and never blocks the verdict.
5. No shaming copy. The "already paid?" path comes first in the next steps.
6. Works at 320 px wide, in light and dark modes, with keyboard focus visible and reduced motion respected.

## Success metrics

See [METRICS.md](METRICS.md).

## Risks

| Risk | Mitigation |
|---|---|
| Someone trusts "no signs" and loses money | No "safe" verdict, "still verify" copy, safety text on every result, missed-scam guardrail |
| People won't paste (H6) | Privacy shown at the input; test WhatsApp/screenshot flow next |
| Rules overfit to the synthetic eval | Rebuild the held-out set from real messages before launch (see [DECISIONS.md](DECISIONS.md)) |
| Link lookup seen as data collection | Only links are sent, disclosed in the privacy note; the lookup is off unless configured |

## Open questions

- Link check host: Cloudflare Workers (decided 11 Nov 2026). Confirm free-plan limits before launch.
- Safe Browsing's non-commercial terms [S9]: confirm they cover this project before deploying.
- Analytics endpoint: what receives the counts-only events?
- Does cybercrime.gov.in's "Report and Check Suspect" belong in the result? Verify on the portal first.
