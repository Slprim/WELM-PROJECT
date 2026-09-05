/**
 * Uploads paystack-config.php to the account root (/home/kingddbn), one level
 * ABOVE public_html, where the web server cannot serve it.
 *
 * The deploy script targets /public_html and so cannot place this file.
 *
 *   node scripts/upload-config.mjs <local-file> [--dry-run]
 *
 * Credentials come from .ftp-credentials (gitignored) or the environment.
 * The secret is never printed.
 */
import { Client } from "basic-ftp";
import fs from "node:fs";
import path from "node:path";

// Load .ftp-credentials without echoing anything.
const credFile = ".ftp-credentials";
if (fs.existsSync(credFile)) {
  for (const line of fs.readFileSync(credFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !line.trimStart().startsWith("#")) process.env[m[1]] ??= m[2].trim();
  }
}

const { FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT = "21" } = process.env;
if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error("Missing FTP_HOST / FTP_USER / FTP_PASS.");
  console.error("Fill in FTP_PASS= in .ftp-credentials and run again.");
  process.exit(1);
}

const local = process.argv[2];
const dryRun = process.argv.includes("--dry-run");
if (!local || !fs.existsSync(local)) {
  console.error(`No such file: ${local ?? "(no path given)"}`);
  process.exit(1);
}

const remoteName = "paystack-config.php";
const client = new Client(60_000);

try {
  let secure = true;
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: Number(FTP_PORT), secure: true, secureOptions: { rejectUnauthorized: false } });
  } catch (e) {
    console.warn(`  ! FTPS refused (${e.message}); retrying WITHOUT encryption`);
    console.warn("  ! the password will cross the network in clear text - change it afterwards");
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: Number(FTP_PORT), secure: false });
    secure = false;
  }
  console.log(`  connected${secure ? " over FTPS" : " (PLAIN FTP)"} as ${FTP_USER}`);
  console.log(`  remote cwd: ${await client.pwd()}`);

  const before = await client.list();
  console.log("  account root contains:", before.map((f) => f.name).join(", ") || "(empty)");

  const existing = before.find((f) => f.name === remoteName);
  if (existing) console.log(`  existing ${remoteName}: ${existing.size} bytes - will be overwritten`);

  if (dryRun) {
    console.log("  DRY RUN - nothing uploaded");
  } else {
    await client.uploadFrom(local, remoteName);
    const after = (await client.list()).find((f) => f.name === remoteName);
    console.log(`  uploaded ${path.basename(local)} -> ${remoteName} (${after?.size ?? "?"} bytes)`);
    if (after && after.size !== fs.statSync(local).size) {
      console.error("  ! size mismatch - upload may be corrupt");
      process.exitCode = 1;
    }
  }
} catch (e) {
  console.error("  FAILED:", e.message);
  process.exitCode = 1;
} finally {
  client.close();
}
