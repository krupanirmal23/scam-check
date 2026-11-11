/*
 * Scam Check rules engine.
 * Runs entirely in the browser (and in Node for the eval). The pasted text never leaves the device.
 * Every rule that fires is shown to the user in plain words, so the verdict is never a black box.
 *
 * Covers English, Hinglish (Romanised Hindi) and Hindi (Devanagari).
 * Patterns come from the RBI BE(A)WARE booklet [S5], Sanchar Saathi Chakshu categories [S3]
 * and discovery notes. Add new patterns here; re-run `npm run eval` after every change.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ScamRules = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const VERSION = "rules-v1.4";

  // Severity weights. "critical" alone is enough for "Likely scam".
  const W = { critical: 4, strong: 3, medium: 2, weak: 1 };

  // Devanagari has no \b word boundaries, so Hindi patterns are plain substrings.
  const rx = (s) => new RegExp(s, "i");

  const SECRET =
    "(otp|o\\.t\\.p|one[ -]?time[ -]?password|upi[ -]?pin|m-?pin|atm[ -]?pin|\\bpin\\b|cvv|card (number|no|details)|debit card|credit card|net ?banking (password|id)|password|(\\d|four|six|4|6)[ -]?digit code|verification code|ओटीपी|पिन|सीवीवी|पासवर्ड|कार्ड नंबर)";
  const ASK =
    "(share|send|tell|give|provide|enter|type|reply with|forward|confirm|batao|bataye|bataiye|batayein|bhejo|bheje|bhejiye|bhejein|dalo|daalo|daaliye|dijiye|de do|बताएं|बताइए|बताओ|भेजें|भेजिए|भेजो|डालें|दर्ज करें|दीजिए|शेयर करें)";
  // Genuine OTP and bank messages warn people *not* to share. That must not count as a request.
  const WARNING_CONTEXT = rx(
    "(do not|don't|dont|never|not to|mat|na kare|na karein|naa|kabhi nahi|kisi ko (bhi )?(na|mat)|न करें|ना करें|मत|कभी नहीं|किसी (को|के साथ) (भी )?(न|ना|मत)|साझा न)"
  );

  // Genuine transaction alerts say "Not you? Call …". Those sentences shouldn't count as urgency or a call-this-number push.
  const NOT_YOU = rx("(not you|if not (done by )?you|not done by you|didn't do this|yadi yah aapne nahi|यदि यह आपने नहीं|अगर यह आपने नहीं)");
  const sentencesOf = (t) => t.split(/[.!?\n।|]+(?=\s|$)/);
  const outsideNotYou = (t, re) => sentencesOf(t).some((s) => !NOT_YOU.test(s) && re.test(s));

  const SHORTENERS = [
    "bit.ly", "tinyurl.com", "cutt.ly", "is.gd", "rb.gy", "t.ly", "shorturl.at", "tiny.cc",
    "ow.ly", "goo.gl", "rebrand.ly", "bitly.com", "s.id", "t.co", "v.gd", "shrtco.de", "u.to", "clck.ru",
  ];
  const RISKY_TLDS = [
    "xyz", "top", "club", "info", "online", "site", "live", "buzz", "icu", "shop", "vip", "work",
    "click", "link", "rest", "fit", "cfd", "sbs", "monster", "cyou", "today", "app", "page", "ml", "tk", "ga", "cf", "gq",
  ];
  const BRAND_WORDS = [
    "sbi", "hdfc", "icici", "axis", "kotak", "pnb", "bob", "canara", "paytm", "phonepe", "gpay", "googlepay",
    "bhim", "npci", "upi", "kyc", "rbi", "aadhaar", "aadhar", "uidai", "pan", "incometax", "itr", "refund",
    "indiapost", "post", "fedex", "dhl", "bluedart", "delhivery", "amazon", "flipkart", "jio", "airtel", "bsnl",
    "electricity", "bijli", "msedcl", "bescom", "tneb", "uppcl", "bses", "challan", "parivahan", "fastag", "epfo", "pmkisan", "yojana",
  ];
  // Real domains for brands people get impersonated as. A match here does not make a message safe;
  // it only stops the lookalike rule from firing on the genuine site.
  const OFFICIAL_DOMAINS = [
    "sbi.co.in", "onlinesbi.sbi", "sbi.bank.in", "hdfcbank.com", "hdfc.bank.in", "icicibank.com", "icici.bank.in",
    "axisbank.com", "axis.bank.in", "kotak.com", "pnbindia.in", "bankofbaroda.in", "canarabank.com",
    "paytm.com", "phonepe.com", "pay.google.com", "npci.org.in", "rbi.org.in", "uidai.gov.in",
    "incometax.gov.in", "indiapost.gov.in", "fedex.com", "dhl.com", "bluedart.com", "delhivery.com",
    "amazon.in", "amazon.com", "amzn.in", "amzn.to", "flipkart.com", "fkrt.it", "jio.com", "airtel.in", "bsnl.co.in",
    "parivahan.gov.in", "echallan.parivahan.gov.in", "epfindia.gov.in", "pmkisan.gov.in", "cybercrime.gov.in", "sancharsaathi.gov.in",
    "gov.in", "nic.in",
  ];

  // ---------- Rules ----------
  // Each rule: id, severity, label {en, hi}, test(text, ctx) -> boolean | string (detail).
  const RULES = [
    {
      id: "asks_secret",
      hl: SECRET,
      severity: "critical",
      label: {
        en: "Asks you to share an OTP, PIN, CVV, card number or password",
        hi: "OTP, PIN, CVV, कार्ड नंबर या पासवर्ड मांगा जा रहा है",
      },
      test(t) {
        const sentences = t.split(/[.!?\n।|]+/);
        return sentences.some((s) => {
          if (!rx(SECRET).test(s) || WARNING_CONTEXT.test(s)) return false;
          return rx(ASK + "[^.]{0,40}" + SECRET).test(s) || rx(SECRET + "[^.]{0,40}" + ASK).test(s);
        });
      },
    },
    {
      id: "pin_to_receive",
      hl: "(upi[ -]?pin|\\bpin\\b|पिन|\\bqr\\b|scan|स्कैन)",
      severity: "critical",
      label: {
        en: "Says you must enter a PIN or scan a code to receive money (you never need a PIN to receive)",
        hi: "पैसे पाने के लिए PIN डालने या QR स्कैन करने को कहा गया है (पैसे पाने के लिए PIN कभी नहीं लगता)",
      },
      test(t) {
        return (
          rx("(pin|scan|qr)[^.]{0,60}(receive|get|credit|claim|accept|recieve|milenge|milega|prapt|पाने|प्राप्त|मिलेंगे|मिलेगा)").test(t) ||
          rx("(receive|get|credit|claim|accept|recieve|milenge|paane|पाने|प्राप्त)[^.]{0,60}(upi )?(pin|scan|qr|पिन|स्कैन)").test(t) ||
          rx("(collect request|payment request|request money)[^.]{0,60}(accept|approve|pin)").test(t)
        );
      },
    },
    {
      id: "remote_app",
      hl: "(anydesk|teamviewer|quick ?support|rustdesk|airdroid|[\\w-]+\\.apk|screen ?share|share (your |the )?screen|स्क्रीन शेयर|download|install|इंस्टॉल|डाउनलोड)",
      severity: "critical",
      label: {
        en: "Asks you to install an app, open an APK file or share your screen",
        hi: "कोई ऐप या APK फ़ाइल इंस्टॉल करने या स्क्रीन शेयर करने को कहा गया है",
      },
      test(t) {
        return (
          rx("\\b(anydesk|teamviewer|quick ?support|rustdesk|airdroid|alpemix)\\b").test(t) ||
          rx("\\.apk\\b").test(t) ||
          rx("(screen ?shar|share (your |the )?screen|स्क्रीन शेयर)").test(t) ||
          rx("(install|download|इंस्टॉल|डाउनलोड)[^.]{0,40}(this |the |our |is |ye |yeh )?(app|application|ऐप|एप)").test(t)
        );
      },
    },
    {
      id: "threat_authority",
      hl: "(digital arrest|arrest warrant|\\barrest(ed)?\\b|\\bfir\\b|police case|police|cyber cell|\\bcbi\\b|narcotics|customs|seized|drugs?|money laundering|court notice|court action|legal action|giraftar|गिरफ्तार|पुलिस|कानूनी कार्रवाई|डिजिटल अरेस्ट)",
      severity: "strong",
      label: {
        en: "Threatens police, arrest, court or customs action (real agencies don't do this by message or video call)",
        hi: "पुलिस, गिरफ्तारी, कोर्ट या कस्टम की धमकी है (असली एजेंसियां मैसेज या वीडियो कॉल पर ऐसा नहीं करतीं)",
      },
      test(t) {
        return rx(
          "(digital arrest|arrest warrant|\\barrest(ed)?\\b|\\bfir\\b|police case|cyber cell|\\bcbi\\b|\\bed\\b officer|narcotics|ncb|customs (duty|department|officer)|parcel (has been )?(seized|held|detained)|drugs? (found|were found)|money laundering|court notice|legal action|girftaar|giraftar|giraftari|गिरफ्तार|गिरफ़्तार|पुलिस केस|एफआईआर|कानूनी कार्रवाई|डिजिटल अरेस्ट)"
        ).test(t);
      },
    },
    {
      id: "utility_cutoff",
      hl: "(electricity|bijli|power|light|connection|बिजली|कनेक्शन)",
      severity: "strong",
      label: {
        en: "Threatens to cut your electricity or gas connection (power companies don't warn you this way)",
        hi: "बिजली या गैस कनेक्शन काटने की धमकी है (बिजली कंपनियां इस तरह चेतावनी नहीं देतीं)",
      },
      test(t) {
        return rx(
          "(electricity|bijli|power|light|gas|connection|बिजली|कनेक्शन)[^.।]{0,80}(disconnect|cut|kat|kaat|band|काट|कट|बंद)|(disconnect|cut off)[^.]{0,40}(electricity|power|connection)"
        ).test(t);
      },
    },
    {
      id: "urgency",
      hl: "(blocked|suspended|deactivated|disconnect(ed|ion)?|blacklisted|frozen|immediately|urgent(ly)?|within \\d+ ?(hours?|hrs?|minutes?)|\\d+ (ghante|घंटे)|today itself|expires? today|last (date|day|chance|warning)|final notice|act now|band ho ja\\w+|block ho ja\\w+|kat (jayegi|jayega|diya jayega)|turant|बंद हो जाएगा|बंद हो जाएगी|काट दिया जाएगा|काट दी जाएगी|तुरंत|ब्लॉक)",
      severity: "medium",
      label: {
        en: "Creates urgency or a threat: account blocked, service cut, deadline tonight",
        hi: "जल्दबाज़ी या डर पैदा किया जा रहा है: खाता बंद, सेवा कटेगी, आज रात तक",
      },
      test(t) {
        return outsideNotYou(t, rx(
          "(will be (blocked|suspended|deactivated|disconnected|closed|cut|terminated|frozen)|has been (blocked|suspended|deactivated|frozen)|account (is )?(blocked|suspended|on hold|frozen)|disconnect(ed|ion)?|today itself|within (\\d+|24|48|2) ?(hours?|hrs?|minutes?|mins?)|immediately|urgent(ly)?|last (date|day|chance|warning)|expir(e|es|ed|ing) today|act now|final notice|band ho (jayega|jaega|jayegi|jaegi|jaenge|jayenge)|block ho (jayega|jaega|jayegi)|kat (jayega|jaega|jayegi|di jayegi)|turant|abhi turant|jaldi karein|बंद हो जाएगा|बंद हो जाएगी|ब्लॉक|काट दी जाएगी|कट जाएगा|तुरंत|अंतिम चेतावनी|24 घंटे)"
        ));
      },
    },
    {
      id: "kyc",
      hl: "(kyc|k\\.y\\.c|केवाईसी|pan card|\\bpan\\b|aadha?ar)",
      severity: "weak", // genuine banks send KYC reminders too; it only counts alongside other signs
      label: {
        en: "Asks you to update KYC, PAN or Aadhaar details",
        hi: "KYC, PAN या आधार अपडेट करने को कहा गया है",
      },
      test(t) {
        return rx(
          "(kyc|k\\.y\\.c|केवाईसी)[^.]{0,40}(update|expire|expired|pending|incomplete|verify|suspend|block|karein|kare|कराएं|करें|अपडेट)|(update|verify|link)[^.]{0,20}(kyc|pan( card)?|aadha?ar)|(pan|aadha?ar)[^.]{0,30}(not linked|link karein|link now|अपडेट|लिंक करें)"
        ).test(t);
      },
    },
    {
      id: "too_good",
      hl: "(you (have )?won|lottery|lucky draw|lucky winner|\\bkbc\\b|jackpot|prize|reward points?|redeem( now)?|part[- ]time (job|work)|work from home|earn rs\\.? ?[\\d,]+|daily income|like (youtube )?videos|rating dena|pre-?approved loan|instant loan|without documents|no cibil|guaranteed \\d+% returns|jeet\\w*|inaam|इनाम|लॉटरी|जीती|घर बैठे|ghar baithe)",
      severity: "medium",
      label: {
        en: "Offers a prize, lottery, easy job, instant loan or reward out of nowhere",
        hi: "अचानक इनाम, लॉटरी, आसान नौकरी, तुरंत लोन या कैशबैक का लालच",
      },
      test(t) {
        return rx(
          "(you (have )?won|lottery|lucky draw|lucky winner|\\bkbc\\b|jackpot|prize money|cash prize|gift (card|voucher) worth|reward points? (expir|redeem)|redeem (now|your)|claim (your|now)|part[- ]time (job|work)|work from home|earn (rs\\.?|₹|inr)? ?\\d|daily (income|earning)|per day earn|like (youtube )?videos|rate (hotels|products)|simple tasks?|pre-?approved loan|instant loan|loan (approved|sanctioned)|without (any )?documents|no cibil|jeet(a|e|o)|inaam|इनाम|लॉटरी|बधाई हो|आपने जीत|घर बैठे|कमाएं|लोन मंजूर|तुरंत लोन)"
        ).test(t);
      },
    },
    {
      id: "pays_to_get",
      hl: "((registration|processing|verification|security|redelivery|re-delivery|handling|customs|clearance|activation|joining|file) (fee|charge|charges|amount)|शुल्क|फीस)",
      severity: "medium",
      label: {
        en: "Asks you to pay a small fee to get money, a refund, a job or a delivery",
        hi: "पैसा, रिफंड, नौकरी या डिलीवरी पाने के लिए पहले छोटी फीस मांगी गई है",
      },
      test(t) {
        return rx(
          "(registration|processing|verification|security|redelivery|re-delivery|handling|customs|clearance|activation|joining|file) (fee|charge|charges|amount)|pay (rs\\.?|₹|inr) ?\\d+[^.]{0,40}(to (get|receive|claim|release|activate|verify|redeliver))|(fees?|शुल्क|फीस)[^.]{0,20}(jama|जमा|bharein|भरें)"
        ).test(t);
      },
    },
    {
      id: "wrong_transfer",
      hl: "(by mistake|mistakenly|wrongly (sent|transferred)|galti se|गलती से)",
      severity: "medium",
      label: {
        en: "Claims money was sent to you by mistake and asks you to return it",
        hi: "कहता है कि गलती से पैसे भेजे गए और वापस मांगता है",
      },
      test(t) {
        return rx(
          "(by mistake|mistakenly|wrongly (sent|transferred)|sent (to you )?by mistake|galti se|गलती से)[^]{0,80}(return|send back|refund|wapas|vapas|lauta|वापस|लौटा)"
        ).test(t);
      },
    },
    {
      id: "govt_scheme",
      hl: "(free (laptop|recharge|scooty|smartphone)|(muft|मुफ्त|मुफ़्त) ?\\S*|yojana|योजना|scheme|sarkar|सरकार)",
      severity: "medium",
      label: {
        en: "Claims a government scheme is giving out free money, laptops or recharges",
        hi: "दावा है कि सरकारी योजना मुफ्त पैसे, लैपटॉप या रिचार्ज दे रही है",
      },
      test(t) {
        return rx(
          "((pm|pradhan mantri|modi|government|govt|sarkar|sarkari|प्रधानमंत्री|सरकार|सरकारी)[^.]{0,60}(free|muft|मुफ्त|मुफ़्त|scheme|yojana|योजना|giving|de rahi|दे रही)[^.]{0,60}(rs\\.?|₹|laptop|recharge|cash|money|paise|पैसे|लैपटॉप|रिचार्ज|\\d{3,}))|free (laptop|recharge|scooty|smartphone)|(muft|मुफ्त|मुफ़्त) (recharge|laptop|रिचार्ज|लैपटॉप)"
        ).test(t);
      },
    },
    {
      id: "call_this_number",
      hl: "(?<!\\d)(\\+?91[ -]?)?[6-9]\\d{4}[ -]?\\d{5}(?!\\d)",
      severity: "weak",
      label: {
        en: "Asks you to call or WhatsApp a number given in the message",
        hi: "मैसेज में दिए नंबर पर कॉल या व्हाट्सऐप करने को कहा गया है",
      },
      test(t) {
        // Indian mobile numbers only (not 1800/1860 toll-free lines), and not inside a "Not you? Call" line.
        const MOBILE = "(?<!\\d)(\\+?91[ -]?)?[6-9]\\d{4}[ -]?\\d{5}(?!\\d)";
        return (
          outsideNotYou(t, rx("(call|contact|whatsapp|reach|message|sampark|samparq|संपर्क|कॉल)[^.]{0,40}" + MOBILE)) ||
          outsideNotYou(t, rx(MOBILE + "[^.]{0,30}(par|pe|पर)[^.]{0,10}(call|sampark|संपर्क|कॉल)"))
        );
      },
    },
    {
      id: "link_shortened",
      severity: "medium",
      label: {
        en: "Contains a shortened link that hides where it really goes",
        hi: "छोटा किया गया लिंक है, जो असली पता छिपाता है",
      },
      test(t, ctx) {
        const hits = ctx.links.filter((l) => SHORTENERS.includes(l.host) && !OFFICIAL_DOMAINS.includes(l.host));
        return hits.length ? hits.map((l) => l.host).join(", ") : false;
      },
    },
    {
      id: "link_lookalike",
      severity: "strong",
      label: {
        en: "Contains a link that looks like a bank, company or government site but isn't its real address",
        hi: "लिंक किसी बैंक, कंपनी या सरकारी साइट जैसा दिखता है, पर उसका असली पता नहीं है",
      },
      test(t, ctx) {
        const hits = ctx.links.filter((l) => {
          if (isOfficial(l.host)) return false;
          const bare = l.host.replace(/[^a-z0-9]/g, "");
          const brandy = BRAND_WORDS.some((b) => bare.includes(b));
          const ip = /^\d{1,3}(\.\d{1,3}){3}$/.test(l.host);
          const tld = l.host.split(".").pop();
          const risky = RISKY_TLDS.includes(tld);
          const hyphenated = (l.host.match(/-/g) || []).length >= 2;
          return ip || (brandy && (risky || hyphenated || l.host.split(".").length > 2 || !l.host.endsWith(".com"))) || (risky && hyphenated);
        });
        return hits.length ? hits.map((l) => l.host).join(", ") : false;
      },
    },
    {
      id: "link_present",
      severity: "weak",
      label: {
        en: "Contains a link. Don't open links from messages you didn't expect",
        hi: "लिंक मौजूद है। अनजान मैसेज के लिंक न खोलें",
      },
      test(t, ctx) {
        return ctx.links.some((l) => !isOfficial(l.host));
      },
    },
  ];

  // Finds where each fired rule matched, so the UI can underline those words in the message.
  // Returns non-overlapping [{start, end, rule}] sorted by position; the first rule to claim a range keeps it.
  function markSpans(text, fired, ctx) {
    const spans = [];
    const claim = (start, end, rule) => {
      if (end <= start || spans.some((s) => start < s.end && end > s.start)) return;
      spans.push({ start, end, rule });
    };
    // Links first, so a whole URL is one mark rather than words inside it.
    const ordered = [...fired].sort((a, b) => b.id.startsWith("link_") - a.id.startsWith("link_"));
    for (const f of ordered) {
      if (f.id.startsWith("link_")) {
        const hosts = f.id === "link_present" ? ctx.links.filter((l) => !isOfficial(l.host)) : ctx.links.filter((l) => (f.detail || "").split(", ").includes(l.host));
        for (const l of hosts) {
          const i = text.indexOf(l.raw);
          if (i >= 0) claim(i, i + l.raw.length, f.id);
        }
        continue;
      }
      const rule = RULES.find((r) => r.id === f.id);
      if (!rule.hl) continue;
      const re = new RegExp(rule.hl, "gi");
      let m, n = 0;
      while ((m = re.exec(text)) && n++ < 6) {
        if (!m[0]) { re.lastIndex++; continue; }
        claim(m.index, m.index + m[0].length, f.id);
      }
    }
    return spans.sort((a, b) => a.start - b.start);
  }

  function isOfficial(host) {
    return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  }

  // ---------- Helpers ----------
  function extractLinks(text) {
    const out = [];
    const re = /\b((?:https?:\/\/)?(?:www\.)?((?:[a-z0-9-]+\.)+[a-z]{2,}|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/[^\s]*)?)/gi;
    let m;
    while ((m = re.exec(text))) {
      const raw = m[1];
      const host = m[2].toLowerCase().replace(/^www\./, "");
      // Skip things like "Rs.500" or "a/c.no" that aren't links, and email domains.
      const before = text[m.index - 1];
      if (before === "@") continue;
      const tld = host.split(".").pop();
      if (!/^\d+$/.test(tld) && tld.length > 6) continue;
      if (/^(rs|no|a\/c|ac|mr|mrs|dr|st)\.[a-z0-9]+$/i.test(host)) continue;
      out.push({ raw, host });
    }
    return out;
  }

  function detectLanguage(text) {
    const deva = (text.match(/[ऀ-ॿ]/g) || []).length;
    const letters = (text.match(/[a-zऀ-ॿ]/gi) || []).length || 1;
    if (deva / letters > 0.3) return "hi";
    const hinglish = text.match(
      /\b(hai|hain|aapka|aapki|aapke|apka|apki|karein|kare|kijiye|turant|nahi|nahin|jayega|jaega|hoga|milega|milenge|paise|bhejo|batao|kripya|krpya|abhi|wala|wali|ke liye|par|se)\b/gi
    );
    if (hinglish && hinglish.length >= 2) return "hinglish";
    return "en";
  }

  // Masks numbers, emails and UPI IDs so a message can be shown or shared without personal details.
  function mask(text) {
    return text
      .replace(/\b[\w.+-]+@[a-z]+(\.[a-z.]+)?\b/gi, (m) => {
        const [, domain] = m.split("@");
        return "•••@" + domain;
      })
      // Phone, account and OTP-length runs only; amounts like "2000-3000" stay readable.
      .replace(/(\+?\d[\d ]{4,}\d)/g, (m) => {
        const digits = m.replace(/\D/g, "");
        if (digits.length < 6) return m;
        return "•".repeat(Math.max(digits.length - 2, 2)) + digits.slice(-2);
      });
  }

  // ---------- Main ----------
  function analyze(input) {
    const started = Date.now();
    const text = String(input || "").normalize("NFC").replace(/\s+/g, " ").trim();
    const lang = detectLanguage(text);
    const ctx = { links: extractLinks(text) };

    const fired = [];
    for (const rule of RULES) {
      const r = rule.test(text, ctx);
      if (r) fired.push({ id: rule.id, severity: rule.severity, label: rule.label, detail: typeof r === "string" ? r : null });
    }
    // A lookalike or shortened link already says more than "contains a link".
    if (fired.some((f) => f.id === "link_lookalike" || f.id === "link_shortened")) {
      const i = fired.findIndex((f) => f.id === "link_present");
      if (i >= 0) fired.splice(i, 1);
    }

    const spans = markSpans(text, fired, ctx);
    const score = fired.reduce((s, f) => s + W[f.severity], 0);
    const hasCritical = fired.some((f) => f.severity === "critical");

    let verdict;
    if (text.length < 12) verdict = "unsure";
    else if (hasCritical || score >= 5) verdict = "likely_scam";
    else if (score >= 2) verdict = "suspicious";
    else if (score === 1) verdict = "unsure";
    else verdict = "no_signs";

    return {
      verdict,
      score,
      signals: fired,
      lang,
      links: ctx.links.map((l) => l.host),
      spans,
      text,
      govtClaim: fired.some((f) => f.id === "govt_scheme"),
      version: VERSION,
      ms: Date.now() - started,
    };
  }

  return { analyze, mask, detectLanguage, extractLinks, RULES, VERSION };
});
