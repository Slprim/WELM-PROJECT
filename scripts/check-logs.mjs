/**
 * Pulls the Paystack logs off the server and prints them.
 *
 *   node scripts/check-logs.mjs
 *
 * Reads .ftp-credentials (gitignored). Masks anything key-shaped on the way
 * out so logs can be pasted into a chat or an issue safely.
 */
import { Client } from "basic-ftp";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

if (fs.existsSync(".ftp-credentials")) {
  for (const line of fs.readFileSync(".ftp-credentials", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !line.trimStart().startsWith("#")) process.env[m[1]] ??= m[2].trim();
  }
}
const { FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT = "21" } = process.env;
if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error("Missing FTP credentials in .ftp-credentials"); process.exit(1);
}

const mask = (s) => s.replace(/\b(sk|pk)_(test|live)_[A-Za-z0-9]+/g, "$1_$2_<MASKED>");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "welm-logs-"));
const client = new Client(60_000);

const wanted = [
  { remote: "paystack-giving.log", label: "GIFTS (charge.success)" },
  { remote: "paystack-router.log", label: "ROUTER FAILURES only" },
  { remote: "/public_html/api/paystack/error_log", label: "PHP ERRORS" },
];

try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, port: Number(FTP_PORT), secure: true, secureOptions: { rejectUnauthorized: false } });
  const root = (await client.list()).filter((f) => /\.log$/.test(f.name));
  console.log(`logs in account root: ${root.length ? root.map((f) => `${f.name} (${f.size}b)`).join(", ") : "NONE YET"}\n`);

  for (const { remote, label } of wanted) {
    const local = path.join(tmp, path.basename(remote));
    try {
      await client.downloadTo(local, remote);
      const body = fs.readFileSync(local, "utf8").trimEnd();
      console.log(`===== ${label} — ${remote} =====`);
      console.log(body ? mask(body.split("\n").slice(-20).join("\n")) : "(empty)");
    } catch {
      console.log(`===== ${label} — ${remote} =====`);
      console.log("(does not exist yet)");
    }
    console.log();
  }
} catch (e) {
  console.error("FAILED:", e.message);
  process.exitCode = 1;
} finally {
  client.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
