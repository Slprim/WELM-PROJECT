/**
 * Seeds themes of the month from the ministry's own monthly artwork.
 *
 * Only the two whose wording I could read off the graphic get a title; the
 * rest are seeded with the artwork and month, and the title left for the
 * ministry to fill in. Better an obvious blank in the Studio than a title I
 * guessed at.
 *
 * Idempotent — existing entries are left alone unless -- --replace.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });
const replace = process.argv.includes("--replace");
const root = resolve(process.cwd(), "..");

type Entry = {
  id: string;
  month: string;
  file: string;
  title?: string;
  scripture?: string;
  note?: string;
};

// Months are taken from the filenames. Where a year is not in the filename
// the artwork sits with the 2023 set, so 2023 is used.
const entries: Entry[] = [
  { id: "2023-02", month: "2023-02-01", file: "img/Themes/Month/Feb 23.jpg" },
  { id: "2023-03", month: "2023-03-01", file: "img/Themes/Month/Mar 2023.jpg" },
  { id: "2023-04", month: "2023-04-01", file: "img/Themes/Month/MONTH OF APRIL.jpg" },
  {
    id: "2023-08",
    month: "2023-08-01",
    file: "img/Themes/Month/Aug 2023.jpg",
    title: "Making A Practise Of The Word Of God",
  },
  { id: "2023-09", month: "2023-09-01", file: "img/Themes/Month/September .jpg" },
  {
    id: "2023-10",
    month: "2023-10-01",
    file: "img/Themes/Month/Month of October.jpg",
    title: "Thanking God For The Little",
    note: "Thanking God for the little, and using them to do great things.",
  },
  { id: "2023-11", month: "2023-11-01", file: "img/Themes/Month/Nov.jpg" },
  { id: "2023-12", month: "2023-12-01", file: "img/Themes/Month/Dec.jpg" },
];

let made = 0, skipped = 0;

for (const e of entries) {
  const id = `monthly-theme-${e.id}`;
  if ((await client.getDocument(id)) && !replace) {
    console.log(`  = ${e.id}: exists`);
    skipped++;
    continue;
  }

  const path = resolve(root, e.file);
  if (!existsSync(path)) {
    console.log(`  ! ${e.id}: ${e.file} missing`);
    continue;
  }

  const label = new Date(`${e.month}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const asset = await client.assets.upload("image", readFileSync(path), {
    filename: basename(path),
  });

  const doc: any = {
    _id: id,
    _type: "monthlyTheme",
    month: e.month,
    // A placeholder title would read as real content on the live site, so the
    // month itself stands in and is obviously incomplete in the Studio.
    title: e.title ?? label,
    artwork: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt: `${label} theme artwork`,
    },
  };
  if (e.scripture) doc.scripture = e.scripture;
  if (e.note) doc.note = e.note;

  await client.createOrReplace(doc);
  console.log(`  + ${e.id}${e.title ? ` — ${e.title}` : " (title needs filling in)"}`);
  made++;
}

console.log(`\nMonthly themes: ${made} added, ${skipped} left alone.`);
console.log("Titles showing only a month name still need the real theme wording.");
