# What I believe about scam messages, before I talk to anyone

**Author:** Krupa Nirmal · **Written:** 11 November 2026, before the first interview · **Status:** baseline (not edited after discovery; updates go in [DISCOVERY.md](DISCOVERY.md))

## Problem statement (a hypothesis, not a finding)

People in India get messages on SMS, WhatsApp and UPI apps that might be scams. When they're unsure, they guess, ignore it, or forward it to someone they trust and wait. There's no quick, trustworthy way to get a second opinion and know what to do next.

## Hypotheses

| # | I believe… | I'm wrong if… | Risk if false |
|---|---|---|---|
| H1 | The person most unsure is often a parent or older relative, and the "real" user may be the family member they forward it to. | Most people I talk to decide on their own and never forward. | Medium: changes who I build for |
| H2 | When unsure, people forward to someone they trust or search online. | People say they mostly just ignore and delete. | Medium |
| H3 | The moment of doubt happens often enough to make a checker worth opening. | People can't remember a recent moment of doubt. | **High: sinks the project** |
| H4 | People want a short verdict and one clear next step, not a lesson. | People ask mainly for education or tips. | Low: changes the result screen |
| H5 | English-only will leave many people out (Hindi, Hinglish, regional languages). | The messages people share and the language they ask in are mostly English. | Medium: changes scope |
| H6 | Pasting a personal message into an unknown tool feels risky, so trust and privacy are the biggest blockers. | People don't mention privacy even when I ask. | **High: sinks the checker form** |

## Riskiest assumptions, tested first

**H3** (is the doubt frequent?) and **H6** (will people paste at all?). If either is false, a paste-in checker is the wrong product. The first questions in the interview script go straight at them: "Tell me about the last time…" (H3) and "Would you show someone the message? What would stop you?" (H6).

## Gate thresholds (set before the first call)

| If discovery shows… | Then I… |
|---|---|
| Fewer than **6 of 10** people remember a moment of doubt in the last month | Stop. The problem isn't frequent enough. |
| The doubt is real, but **most** people won't paste or forward messages | Change the form: checklist, forward-to-family flow, or education. |
| The family helper is the real user | Change who I build for and how results are shared. |
| Most messages are in a language I can't handle well | Narrow to the language I can test properly, and say so. |
| People already have a check they trust | Find out what it misses, or stop. |
