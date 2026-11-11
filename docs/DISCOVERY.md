# Discovery rehearsal: 12 synthetic interviews

> **Read this first.** None of these 12 people exist. Each interview was role-played by a separate AI agent given a persona (age, city, languages, phone habits) and the interview script from the plan. The agents never saw the hypotheses.
>
> This is a **rehearsal**, used to stress-test the script, the hypotheses and the first version of the checker. It is **not discovery**. The plan's ground rules still apply: the 10–20 real conversations happen, and only real conversations produce numbers for posts, the case study or the resume. Every count below is "of 12 synthetic personas" and must not be quoted as research.

**Run:** 11 November 2026 · **Script:** plan step 2, unchanged · **Raw log:** [interview_log.csv](interview_log.csv)

## Who was "interviewed"

| ID | Segment | Persona | Language they asked in |
|---|---|---|---|
| P01 | Recipient, 60+ | Retired electricity-board clerk, Lucknow | Hinglish |
| P02 | Recipient, student | BCom student, Pune, wants part-time income | Hinglish |
| P03 | Family helper | Software engineer, Bengaluru; parents in Indore | English |
| P04 | Recipient, 40s | Homemaker selling pickles on WhatsApp, Jaipur | Hindi (Devanagari) |
| P05 | Recipient, shopkeeper | Hardware shop owner on UPI QR, Surat | Hinglish + Gujarati |
| P06 | Lost money | Car-dealership sales exec, Delhi | Hinglish |
| P07 | Close observer | Assistant manager, PSU bank branch, Chennai | English |
| P08 | Close observer | Housing-society secretary, Thane | English + Marathi/Hindi |
| P09 | Recipient, confident | Fintech analyst, Hyderabad | English |
| P10 | Recipient, 70+ | Retired teacher living alone, Kolkata | English + Bengali |
| P11 | Recipient, gig worker | Delivery rider, Patna | Hinglish |
| P12 | Recipient, privacy-minded | Corporate lawyer, Gurugram | English |

## Hypotheses after the rehearsal

| # | Hypothesis | Rehearsal says | Notes |
|---|---|---|---|
| H1 | Real user may be the family helper | **Partly supported** | Older recipients (P01, P04, P10) asked a son, neighbour or retired banker. Helpers (P03, P08) want a one-line reason they can pass on, "in Hindi for my parents". Build for the recipient, but make the result easy to forward. |
| H2 | People forward or search | **Supported** | 10 of 12 asked someone. Wait times ranged from seconds (P09) to "4–5 hours, I didn't eat properly" (P10). Two checked the official app themselves (P06, P12). |
| H3 | The doubt is frequent | **Supported** | All 12 recalled one in the last few weeks; several said "every few weeks" or "3–4 a week". |
| H4 | Short verdict + one next step | **Strongly supported** | Every persona asked for "haan ya na" plus one line of why. Nobody asked for tips. |
| H5 | English-only leaves people out | **Supported, and wider than Hindi** | Asked for Hindi: P01, P04, P05, P06, P08, P11. Also Gujarati (P05), Marathi (P08), Bengali (P10), Tamil in Roman script (P07). |
| H6 | Privacy is the biggest blocker | **Supported: the riskiest finding** | 11 of 12 would hesitate to paste into "a random website". Reasons: the message holds personal details, nobody knows who runs the site, fear of more spam, a login or phone number "and it's finished" (P08). P07 and P08 add that many older people can't copy-paste, only forward or screenshot. |

## Surprises

1. **Shame delays action.** P06, P07, P08 and P10 described people waiting a day or more before telling anyone. The result must never make someone feel foolish, and the "already paid?" path has to be calm and immediate.
2. **"Has something already happened to my money?"** P10 and P11 worried that just opening a message could cost them. The next-steps block now starts with "Already tapped the link, shared a code or paid?"
3. **Phone calls, not messages, caused most losses.** The losses described came from calls (P06, P10's relative, P12's father). Call screening stays a non-goal, but the result points to 1930 regardless of channel.
4. **Copy-paste is a skill.** For many older users, forwarding or screenshotting is the only way to share. That argues for a WhatsApp channel or screenshot (image) support later.
5. **Trust comes from who runs it.** P09 and P12 would trust "Google, the government, or a bank". A personal project can't borrow that. It can show a name, say plainly what is kept, and ask for no login.

## Gate decision (rehearsal)

Against the thresholds in [HYPOTHESES.md](HYPOTHESES.md):

- Doubt is frequent (12 of 12 against a bar of 6 of 10): **no stop**.
- The doubt is real, but pasting is a blocker: **change the form, don't stop.** v1 keeps the paste checker and makes privacy visible at the point of pasting. Checking happens on the phone and the page says so next to the box. There's no login, and numbers are masked. A WhatsApp or screenshot path is the first thing to test if real users won't paste.
- Family helper as user: **partly**. Recipient-first design, with a "Send this result to family" button.
- Language: **v1 covers English, Hinglish and Hindi** (your decision). Gujarati, Marathi and Bengali come up but are out of scope until real usage shows them.

**Call: GO with changes, on a rehearsal basis.** It becomes a real decision only after the real interviews.

## Weaknesses of this rehearsal

- **Convergence.** 5 of 12 personas told nearly the same "electricity cut tonight at 9:30" story, and two had an uncle who lost "about forty thousand". Synthetic interviewees fall back on the same widely reported stories, so this rehearsal over-weights famous scam types and can't reveal anything truly unknown.
- **My questions, my personas.** I wrote the personas, so my assumptions shaped them.
- **No follow-up questions.** Each agent answered the script in one pass, so I couldn't probe the way a real interview would.

## What to take into the real interviews

- Ask H6 more concretely: "If I sent you a link right now, would you paste this message in? What would you take out first?"
- Ask how they would *share* a message: copy text, forward, or screenshot.
- Recruit beyond Hindi-belt personas on purpose: Tamil, Bengali, Marathi and Gujarati speakers.
- Watch whether the electricity and KYC stories actually dominate, or whether that's an artefact of the rehearsal.
