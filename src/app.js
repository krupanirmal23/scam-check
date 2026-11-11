(function () {
  "use strict";

  const CONFIG = window.SCAM_CHECK_CONFIG || {};
  const STR = window.SCAM_STRINGS;
  const { analyze, mask } = window.ScamRules;
  const $ = (id) => document.getElementById(id);

  const EXAMPLES = {
    electricity: "Dear Customer, aapka bijli connection aaj raat 9:30 PM baje disconnect kiya jayega kyunki pichle mahine ka bill update nahi hua. Turant 9123456780 pe sampark karein. - Vidyut Vibhag",
    kyc: "प्रिय ग्राहक, आपका Paytm KYC आज रात बंद हो जाएगा। तुरंत अपडेट करें: http://paytm-kyc-help.in/verify धन्यवाद, Paytm टीम",
    job: "Congratulations! You have been shortlisted for Part Time Work From Home. Earn Rs 2000-3000 daily. Only need mobile phone. Pay registration fee Rs 500 and message on WhatsApp +91 9988776655 to start today.",
    otp: "482913 is your OTP for login to SBI YONO. Valid for 3 minutes. Do not share this OTP with anyone. -SBI",
  };

  // ---------- Small storage helpers (may be blocked; the page works without them) ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
  };

  // ---------- Counts-only analytics ----------
  const source = new URLSearchParams(location.search).get("src") || "direct";
  let visitorId = store.get("sc_id");
  if (!visitorId) {
    visitorId = Math.random().toString(36).slice(2, 10);
    store.set("sc_id", visitorId);
  }
  function track(event, props) {
    if (!CONFIG.analyticsUrl) return;
    const body = JSON.stringify({ event, src: source, id: visitorId, t: Date.now(), ...props });
    try { navigator.sendBeacon(CONFIG.analyticsUrl, body); } catch { /* ignore */ }
  }
  track("visit");

  // ---------- Language ----------
  let lang = store.get("sc_lang") || ((navigator.language || "").toLowerCase().startsWith("hi") ? "hi" : "en");
  const t = (k) => STR[lang][k] ?? STR.en[k] ?? k;

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-t]").forEach((el) => {
      const k = el.dataset.t;
      if (STR[lang][k + "_html"]) el.innerHTML = t(k + "_html");
      else el.textContent = t(k);
    });
    document.querySelectorAll("[data-tp]").forEach((el) => (el.placeholder = t(el.dataset.tp)));
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $("privacy-line").textContent = (CONFIG.linkCheckUrl ? t("privacy_links") : t("privacy_local")) + " " + t("tip");
    $("privacy-body").innerHTML = t("privacy_html").replace("{links}", CONFIG.linkCheckUrl ? t("privacy_links_html") : "");
    if (last) render(last, { keepFocus: true });
  }

  document.querySelectorAll("[data-lang]").forEach((b) =>
    b.addEventListener("click", () => {
      lang = b.dataset.lang;
      store.set("sc_lang", lang);
      applyLang();
    })
  );

  // ---------- Checking ----------
  let last = null;
  let linkResult = null; // null | "checking" | {bad: [...]} | "failed"

  $("check-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("msg").value;
    if (text.trim().length === 0) {
      $("form-error").textContent = t("empty");
      $("form-error").hidden = false;
      $("msg").focus();
      return;
    }
    $("form-error").hidden = true;
    runCheck(text);
  });

  document.querySelectorAll("[data-example]").forEach((b) =>
    b.addEventListener("click", () => {
      $("msg").value = EXAMPLES[b.dataset.example];
      track("example", { example: b.dataset.example });
      runCheck($("msg").value);
    })
  );

  function runCheck(text) {
    const r = analyze(text);
    last = r;
    linkResult = null;
    track("check", { len: text.length < 80 ? "short" : text.length < 300 ? "medium" : "long", lang: r.lang });
    track("verdict", { verdict: r.verdict, rules: r.signals.map((s) => s.id), unsure: r.verdict === "unsure", ms: r.ms });
    resetFeedback();
    render(r);
    if (CONFIG.linkCheckUrl && r.links.length) checkLinks(r);
  }

  async function checkLinks(r) {
    linkResult = "checking";
    renderLinkStatus();
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 5000);
      const res = await fetch(CONFIG.linkCheckUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: window.ScamRules.extractLinks(r.text).map((l) => l.raw) }),
        signal: ctl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      if (last !== r) return;
      linkResult = { bad: data.matches || [] };
      // A known-unsafe link is decisive, so it upgrades the verdict.
      if (linkResult.bad.length) {
        r.verdict = "likely_scam";
        const hosts = [...new Set(linkResult.bad.map((m) => hostOf(m.url)))].join(", ");
        r.signals.unshift({ id: "link_known_bad", severity: "critical", label: { en: STR.en.link_reason, hi: STR.hi.link_reason }, detail: hosts });
        render(r, { keepFocus: true });
      }
      track("link_check", { bad: linkResult.bad.length });
    } catch {
      if (last === r) linkResult = "failed";
    }
    renderLinkStatus();
  }

  function renderLinkStatus() {
    const el = $("link-status");
    // A known-unsafe link is already the first reason, so the status line would only repeat it.
    if (!linkResult || (linkResult.bad && linkResult.bad.length)) { el.hidden = true; return; }
    el.hidden = false;
    el.className = "link-status";
    if (linkResult === "checking") el.textContent = t("links_checking");
    else if (linkResult === "failed") el.textContent = t("links_failed");
    else if (linkResult.bad.length) {
      el.classList.add("bad");
      el.textContent = t("links_bad").replace("{hosts}", linkResult.bad.map((m) => hostOf(m.url)).join(", "));
    } else el.textContent = t("links_clean");
  }
  const hostOf = (u) => { try { return new URL(u).host; } catch { return u; } };

  // ---------- Rendering ----------
  function render(r, opts = {}) {
    const res = $("result");
    res.hidden = false;
    res.dataset.verdict = r.verdict;
    // Restart the pen-stroke animation on each new result.
    const stroke = res.querySelector(".pen-stroke");
    stroke.classList.remove("draw");
    void stroke.getBoundingClientRect();
    stroke.classList.add("draw");

    $("verdict-title").textContent = t("v_" + r.verdict);
    $("verdict-do").textContent = t("do_" + r.verdict);

    // Number each reason; marks in the message carry the same number.
    const numbered = r.signals.filter((s) => s.id !== "link_known_bad");
    const numberOf = Object.fromEntries(numbered.map((s, i) => [s.id, i + 1]));
    renderBubble(r, numberOf);
    $("bubble-caption").textContent = r.spans.length ? t("caption_marked") : t("caption_plain");

    const list = $("reasons");
    list.innerHTML = "";
    for (const s of r.signals) {
      const li = document.createElement("li");
      li.className = "sev-" + s.severity;
      if (numberOf[s.id]) li.dataset.n = numberOf[s.id];
      else li.classList.add("unnumbered");
      li.textContent = s.label[lang] || s.label.en;
      if (s.detail) {
        const d = document.createElement("span");
        d.className = "detail";
        d.textContent = s.detail;
        li.append(" ", d);
      }
      list.append(li);
    }
    if (!r.signals.length) {
      const li = document.createElement("li");
      li.className = "none";
      li.textContent = t("noticed_none");
      list.append(li);
    }
    // Offer the other language when the message is in Hindi or Hinglish but the page is in English, and vice versa.
    document.querySelectorAll(".lang-hint").forEach((h) => h.remove());
    const wantHi = r.lang !== "en";
    if ((wantHi && lang === "en") || (!wantHi && lang === "hi")) {
      const hint = document.createElement("button");
      hint.type = "button";
      hint.className = "text-button lang-hint";
      hint.lang = lang === "en" ? "hi" : "en";
      hint.textContent = t("lang_hint");
      hint.addEventListener("click", () => {
        lang = lang === "en" ? "hi" : "en";
        store.set("sc_lang", lang);
        applyLang();
      });
      list.after(hint);
    }

    // The PIB route matters most for government-scheme claims, so it moves up for those.
    const pib = $("pib-block");
    const next = pib.parentElement;
    if (r.govtClaim) next.insertBefore(pib, next.querySelector(".next-block"));
    else next.insertBefore(pib, next.querySelector(".fine"));

    $("share").href = "https://wa.me/?text=" + encodeURIComponent(shareText(r));
    renderLinkStatus();

    if (!opts.keepFocus) {
      res.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      $("verdict-title").focus({ preventScroll: true });
    }
  }

  function renderBubble(r, numberOf) {
    const b = $("bubble");
    b.innerHTML = "";
    let pos = 0;
    const seen = new Set();
    const plain = (s) => document.createTextNode(mask(s));
    for (const sp of r.spans) {
      if (sp.start > pos) b.append(plain(r.text.slice(pos, sp.start)));
      const sig = r.signals.find((s) => s.id === sp.rule);
      const m = document.createElement("mark");
      m.className = "sev-" + sig.severity;
      m.textContent = mask(r.text.slice(sp.start, sp.end));
      // Number only the first mark for each reason, so the message stays readable.
      if (!seen.has(sp.rule) && numberOf[sp.rule]) {
        seen.add(sp.rule);
        const n = document.createElement("sup");
        n.textContent = numberOf[sp.rule];
        n.setAttribute("aria-label", "reason " + numberOf[sp.rule]);
        m.append(n);
      }
      b.append(m);
      pos = sp.end;
    }
    if (pos < r.text.length) b.append(plain(r.text.slice(pos)));
  }

  function shareText(r) {
    const reasons = r.signals.slice(0, 4).map((s) => "• " + (s.label[lang] || s.label.en)).join("\n");
    return t("share_text")
      .replace("{verdict}", t("v_" + r.verdict))
      .replace("{reasons}", reasons)
      .replace("{do}", t("do_" + r.verdict))
      .replace("{url}", location.origin + location.pathname + "?src=share");
  }

  // ---------- Feedback ----------
  function resetFeedback() {
    document.querySelectorAll("[data-feedback]").forEach((b) => { b.disabled = false; b.removeAttribute("aria-pressed"); });
    $("wrong").disabled = false;
    $("feedback-thanks").hidden = true;
    document.querySelectorAll(".lang-hint").forEach((h) => h.remove());
  }
  document.querySelectorAll("[data-feedback]").forEach((b) =>
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-feedback]").forEach((x) => { x.disabled = true; x.setAttribute("aria-pressed", String(x === b)); });
      $("feedback-thanks").textContent = t("thanks");
      $("feedback-thanks").hidden = false;
      track("feedback", { helped: b.dataset.feedback, verdict: last && last.verdict });
    })
  );
  $("wrong").addEventListener("click", () => {
    $("wrong").disabled = true;
    $("feedback-thanks").textContent = t("thanks_wrong");
    $("feedback-thanks").hidden = false;
    track("wrong", { verdict: last && last.verdict, rules: last ? last.signals.map((s) => s.id) : [] });
  });

  $("share").addEventListener("click", () => track("share", { verdict: last && last.verdict }));
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-track]");
    if (a) track("next_step", { link: a.dataset.track });
  });

  $("again").addEventListener("click", () => {
    $("msg").value = "";
    $("result").hidden = true;
    last = null;
    window.scrollTo({ top: 0 });
    $("msg").focus();
  });

  applyLang();
})();
