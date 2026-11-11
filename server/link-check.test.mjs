// `node server/link-check.test.mjs`: exercises the Worker with Google's API mocked, no key or network needed.
import assert from "node:assert/strict";
import worker from "./link-check.js";

const env = { SAFE_BROWSING_API_KEY: "test-key", ALLOWED_ORIGINS: "http://localhost:8080, https://example.github.io" };
let sentToGoogle = null;
globalThis.fetch = async (url, init) => {
  sentToGoogle = { url, body: JSON.parse(init.body) };
  const bad = sentToGoogle.body.threatInfo.threatEntries.filter((e) => e.url.includes("evil"));
  return new Response(JSON.stringify(bad.length ? { matches: bad.map((e) => ({ threatType: "SOCIAL_ENGINEERING", threat: { url: e.url } })) } : {}));
};

const call = (body, origin = "http://localhost:8080", method = "POST") =>
  worker.fetch(new Request("https://w.example/", { method, headers: { Origin: origin, "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(body) : undefined }), env);

// Known-bad link is reported; scheme is added for bare hosts.
let res = await call({ urls: ["evil-kyc.xyz/login", "https://amazon.in"] });
assert.equal(res.status, 200);
assert.deepEqual(await res.json(), { matches: [{ url: "http://evil-kyc.xyz/login", threat: "SOCIAL_ENGINEERING" }] });
assert.equal(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:8080");
assert.match(sentToGoogle.url, /key=test-key/);
assert.equal(sentToGoogle.body.threatInfo.threatEntries.length, 2);

// Only the URLs go to Google: nothing else from the request body is forwarded.
await call({ urls: ["https://bit.ly/x"], text: "my OTP is 123456" });
assert.ok(!JSON.stringify(sentToGoogle.body).includes("123456"));

// Clean result, second allowed origin.
res = await call({ urls: ["https://bit.ly/x"] }, "https://example.github.io");
assert.deepEqual(await res.json(), { matches: [] });
assert.equal(res.headers.get("Access-Control-Allow-Origin"), "https://example.github.io");

// Other sites are refused; preflight works for allowed ones.
assert.equal((await call({ urls: ["a.com"] }, "https://someone-else.com")).status, 403);
assert.equal((await call(null, "http://localhost:8080", "OPTIONS")).status, 200);

// Bad input and missing key.
assert.equal((await call({ urls: "nope" })).status, 400);
sentToGoogle = null;
assert.deepEqual(await (await call({ urls: [] })).json(), { matches: [] });
assert.equal(sentToGoogle, null, "empty list must not call Google");
assert.equal((await worker.fetch(new Request("https://w.example/", { method: "POST", body: "{}" }), {})).status, 503);

// At most 10 URLs per call.
await call({ urls: Array.from({ length: 25 }, (_, i) => `https://s${i}.com`) });
assert.equal(sentToGoogle.body.threatInfo.threatEntries.length, 10);

console.log("link-check: all tests passed");
