/**
 * Uploads web/dist to public_html over FTPS.
 *
 * Credentials come from the environment, never from a file, so they are not
 * written to disk and cannot end up committed:
 *
 *   FTP_HOST=... FTP_USER=... FTP_PASS=... node scripts/deploy-ftp.mjs
 *
 * Flags:
 *   --dry-run   connect, list the remote directory, upload nothing
 *   --clean     remove existing files in public_html first (the parking page)
 */
import { Client } from "basic-ftp";
import path from "node:path";
import fs from "node:fs";

const { FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT = "21" } = process.env;
const dryRun = process.argv.includes("--dry-run");
const clean = process.argv.includes("--clean");

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error("Set FTP_HOST, FTP_USER and FTP_PASS in the environment.");
  process.exit(1);
}

const LOCAL = path.resolve("web/dist");
const REMOTE = "/public_html";

if (!fs.existsSync(LOCAL)) {
  console.error(`No build at ${LOCAL} — run: cd web && npm run build`);
  process.exit(1);
}

const client = new Client(30_000);
client.ftp.verbose = false;

try {
  // Explicit FTPS first; fall back to plain FTP only if the server refuses TLS,
  // and say so loudly, because plain FTP sends the password in the clear.
  let secure = true;
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: Number(FTP_PORT), secure: true, secureOptions: { rejectUnauthorized: false } });
  } catch (e) {
    console.warn(`  ! FTPS refused (${e.message}); retrying WITHOUT encryption`);
    console.warn("  ! the password will cross the network in plain text — change it afterwards");
    secure = false;
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: Number(FTP_PORT), secure: false });
  }

  console.log(`  connected to ${FTP_HOST} as ${FTP_USER}  (${secure ? "FTPS, encrypted" : "PLAIN FTP"})`);
  console.log(`  home directory: ${await client.pwd()}`);

  const top = await client.list();
  console.log(`  ${top.length} entries at this level: ${top.map((f) => f.name).slice(0, 12).join(", ")}`);

  const hasPublicHtml = top.some((f) => f.name === "public_html" && f.isDirectory);
  console.log(`  public_html present: ${hasPublicHtml ? "yes" : "NO — check the FTP account's directory setting"}`);

  if (hasPublicHtml) {
    const inside = await client.list(REMOTE);
    console.log(`  public_html currently holds ${inside.length} entries: ${inside.map((f) => f.name).slice(0, 12).join(", ") || "(empty)"}`);
  }

  if (dryRun) {
    console.log("\n  dry run — nothing uploaded");
  } else {
    if (clean && hasPublicHtml) {
      console.log("  clearing public_html…");
      await client.ensureDir(REMOTE);
      await client.clearWorkingDir();
      console.log("  cleared");
    }
    const started = Date.now();
    client.trackProgress((info) => {
      if (info.name) process.stdout.write(`\r  uploading ${info.name.padEnd(52).slice(0, 52)}`);
    });
    await client.ensureDir(REMOTE);
    await client.uploadFromDir(LOCAL, REMOTE);
    client.trackProgress();
    console.log(`\n  uploaded in ${((Date.now() - started) / 1000).toFixed(1)}s`);

    const after = await client.list(REMOTE);
    const names = after.map((f) => f.name);
    for (const must of [".htaccess", "index.html", "404.html", "robots.txt", "api", "_astro", "video"]) {
      console.log(`  ${names.includes(must) ? "ok  " : "MISS"} ${must}`);
    }
  }
} catch (err) {
  console.error("  FAILED:", err.message);
  process.exitCode = 1;
} finally {
  client.close();
}
