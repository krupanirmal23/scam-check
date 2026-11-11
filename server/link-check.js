// Link check: looks up URLs against Google Safe Browsing (Lookup API v4).
// Receives ONLY the links found in a message, never the message text. Nothing is logged or stored.
//
// Runs on Cloudflare Workers (config in wrangler.toml). Test: npm run test:server
//
// Env: SAFE_BROWSING_API_KEY (secret, required), ALLOWED_ORIGINS (comma-separated sites allowed to call this)
// Safe Browsing is free for non-commercial use [S9]; check the current terms before deploying.

const API = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
const MAX_URLS = 10;

export default {
  async fetch(request, env) {
    // Only the listed sites may call this, so nobody else spends the API quota from a browser.
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean);
    const origin = request.headers.get("Origin");
    if (origin && !allowed.includes(origin)) return new Response("Origin not allowed", { status: 403 });
    const cors = {
      "Access-Control-Allow-Origin": origin || allowed[0] || "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, cors);
    if (!env.SAFE_BROWSING_API_KEY) return json({ error: "not configured" }, 503, cors);

    let urls;
    try {
      ({ urls } = await request.json());
    } catch {
      return json({ error: "bad json" }, 400, cors);
    }
    if (!Array.isArray(urls)) return json({ error: "urls must be an array" }, 400, cors);
    urls = urls.filter((u) => typeof u === "string" && u.length < 2048).slice(0, MAX_URLS);
    if (!urls.length) return json({ matches: [] }, 200, cors);

    const res = await fetch(`${API}?key=${env.SAFE_BROWSING_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "scam-check", clientVersion: "0.1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: urls.map((url) => ({ url: /^https?:\/\//i.test(url) ? url : "http://" + url })),
        },
      }),
    });
    if (!res.ok) return json({ error: "lookup failed" }, 502, cors);
    const data = await res.json();
    const matches = (data.matches || []).map((m) => ({ url: m.threat.url, threat: m.threatType }));
    return json({ matches }, 200, cors);
  },
};

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
