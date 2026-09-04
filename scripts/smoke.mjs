/**
 * Smoke test for the W.E.L.M site. Runs identically against local and live:
 *
 *   node scripts/smoke.mjs http://localhost:4321
 *   node scripts/smoke.mjs https://kingdomofgods.org
 *
 * Checks only things that would be visibly broken to a visitor, so a pass
 * means the deploy is genuinely serving the site — not merely responding.
 * Exits non-zero if anything fails, so it can gate a deploy.
 */
const base = (process.argv[2] ?? "http://localhost:4321").replace(/\/+$/, "");

// Optional DNS override: RESOLVE_TO=104.21.31.149 forces every request for
// this host to a specific IP while keeping the hostname for SNI and Host.
// Needed when a local resolver still has a stale record and would otherwise
// test the origin instead of the CDN a real visitor reaches.
if (process.env.RESOLVE_TO) {
  const { Agent, setGlobalDispatcher } = await import("undici");
  const ip = process.env.RESOLVE_TO;
  setGlobalDispatcher(new Agent({
    connect: {
      lookup: (_hostname, opts, cb) => {
        const family = ip.includes(":") ? 6 : 4;
        // undici sets opts.all, which expects the array form; plain dns.lookup
        // expects (err, address, family). Handle both.
        return opts && opts.all
          ? cb(null, [{ address: ip, family }])
          : cb(null, ip, family);
      },
    },
  }));
  console.log(`  (resolving to ${ip})`);
}
const isLive = !base.includes("localhost") && !base.includes("127.0.0.1");

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

const get = async (path, opts = {}) => {
  const res = await fetch(base + path, { redirect: "follow", ...opts });
  return { status: res.status, text: await res.text(), headers: res.headers, url: res.url };
};

const ROUTES = [
  "/", "/about", "/about/pastor-faith-joseph", "/about/statement-of-faith",
  "/about/central-committee", "/about/mission-and-vision", "/sermons",
  "/blog", "/gallery", "/live", "/give", "/give/thank-you", "/faq", "/contact",
];

console.log(`\nSmoke test → ${base}\n`);

// ---- every route responds -------------------------------------------------
for (const r of ROUTES) {
  try {
    const { status } = await get(r);
    record(`route ${r}`, status === 200, `HTTP ${status}`);
  } catch (e) {
    record(`route ${r}`, false, e.cause?.code ?? e.message);
  }
}

// ---- a real blog post (dynamic route) -------------------------------------
try {
  const { status, text } = await get("/blog/who-am-i");
  record("blog post page", status === 200 && /Who Am I/i.test(text), `HTTP ${status}`);
} catch (e) { record("blog post page", false, e.message); }

// ---- 404 behaviour --------------------------------------------------------
try {
  const { status, text } = await get("/this-page-does-not-exist");
  const custom = /isn't here|404/i.test(text);
  record("404 page serves", status === 404 && custom, `HTTP ${status}${custom ? ", custom page" : ", NOT the custom page"}`);
} catch (e) { record("404 page serves", false, e.message); }

// ---- content actually rendered, not an empty shell ------------------------
try {
  const { text } = await get("/");
  record("home: hero heading", /Kingdom/i.test(text));
  record("home: theme section", /word over the house/i.test(text));
  record("home: programmes", /Upcoming programmes/i.test(text));
  record("home: service listed", /Revelation Sunday Service/i.test(text));
  record("home: CMS images (Sanity CDN)", /cdn\.sanity\.io/.test(text));
} catch (e) { record("home content", false, e.message); }

try {
  const { text } = await get("/about/central-committee");
  record("committee: all 8 members", (text.match(/Pastor |Mrs |Jessica |Dr\. /g) ?? []).length >= 8);
} catch (e) { record("committee", false, e.message); }

// ---- assets that silently break --------------------------------------------
for (const [name, path, type] of [
  ["hero video", "/video/hero.mp4", "video/mp4"],
  ["hero poster", "/video/hero-poster.jpg", "image/jpeg"],
  ["robots.txt", "/robots.txt", "text/plain"],
  ["sitemap", "/sitemap-index.xml", "xml"],
]) {
  try {
    const res = await fetch(base + path);
    const ct = res.headers.get("content-type") ?? "";
    record(name, res.status === 200 && ct.includes(type.split("/")[1] ?? type), `HTTP ${res.status} ${ct}`);
  } catch (e) { record(name, false, e.message); }
}

// ---- giving endpoint -------------------------------------------------------
try {
  const res = await fetch(base + "/api/paystack/initialize.php", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 1, email: "smoke@example.com", fund: "offering" }),
  });
  const body = await res.text();
  // Locally there is no PHP, so 404 is expected. Live, PHP must execute:
  // a 200 with an authorization_url, or a clean JSON error - never raw PHP.
  if (!isLive) {
    record("giving endpoint (skipped locally)", true, `HTTP ${res.status} — no PHP on the dev server`);
  } else {
    const executed = !body.includes("<?php");
    let ok = executed && res.status !== 404;
    record("giving endpoint executes PHP", ok, `HTTP ${res.status} ${body.slice(0, 80).replace(/\s+/g, " ")}`);
    record("giving endpoint never leaks source", executed);
  }
} catch (e) { record("giving endpoint", false, e.message); }

// ---- live-only: things that only matter in production ----------------------
if (isLive) {
  try {
    const res = await fetch(base.replace("https://", "http://") + "/", { redirect: "manual" });
    const loc = res.headers.get("location") ?? "";
    record("HTTP redirects to HTTPS", res.status >= 300 && res.status < 400 && loc.startsWith("https://"), `HTTP ${res.status} → ${loc || "no redirect"}`);
  } catch (e) { record("HTTP redirects to HTTPS", false, e.message); }

  try {
    const { headers } = await get("/");
    record("security header: nosniff", headers.get("x-content-type-options") === "nosniff");
    record("security header: referrer-policy", !!headers.get("referrer-policy"));
  } catch (e) { record("security headers", false, e.message); }

  try {
    const res = await fetch(base + "/api/paystack/paystack-config.php");
    record("secret config NOT reachable", res.status === 403 || res.status === 404, `HTTP ${res.status}`);
  } catch (e) { record("secret config NOT reachable", true, "unreachable"); }

  try {
    const { text } = await get("/robots.txt");
    record("robots points at real domain", text.includes("kingdomofgods.org"), text.trim().split("\n").pop());
  } catch (e) { record("robots domain", false, e.message); }
}

const failed = results.filter((r) => !r.ok);
console.log(`\n  ${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log(`  FAILURES: ${failed.map((f) => f.name).join(", ")}\n`);
  process.exit(1);
}
console.log("  all checks passed\n");
