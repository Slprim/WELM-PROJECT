/**
 * Seeds the gallery with the ministry's real photographs.
 *
 * The legacy Gallery page pointed at six img/portfolio-*.jpg files that do not
 * exist in the repo, so it rendered six broken images. These are actual photos
 * from img/highlight imgs/ and img/Prgrms/.
 *
 * Idempotent — existing photos are left alone unless -- --replace.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });
const replace = process.argv.includes("--replace");
const root = resolve(process.cwd(), "..");

const photos: [string, string, string, string][] = [
  // id-suffix, file, alt, caption
  ["worship-1", "img/highlight imgs/GLC488-21.jpg", "The congregation worshipping with hands raised", "Sunday worship"],
  ["teaching-1", "img/highlight imgs/GLC605-18.jpg", "Pastor Faith Joseph teaching from the pulpit", "The word on a Sunday morning"],
  ["congregation-1", "img/highlight imgs/GLC606-19.jpg", "The congregation gathered together", ""],
  ["gathering-1", "img/highlight imgs/new1.jpg", "Members of the congregation during a service", ""],
  ["gathering-2", "img/highlight imgs/new2.jpg", "Worship at a Sunday morning gathering", ""],
  ["gathering-3", "img/highlight imgs/new3.jpg", "The house gathered on a Sunday", ""],
  ["conference-1", "img/Prgrms/Events 1.jpg", "A ministry conference gathering", "Conference"],
  ["conference-2", "img/Prgrms/Event 2.jpg", "A ministry event", ""],
  ["conference-3", "img/Prgrms/Event 3.jpg", "A ministry event", ""],
];

let made = 0, skipped = 0, missing = 0;

for (const [suffix, file, alt, caption] of photos) {
  const id = `gallery-${suffix}`;
  if ((await client.getDocument(id)) && !replace) {
    console.log(`  = ${suffix}: exists`);
    skipped++;
    continue;
  }
  const path = resolve(root, file);
  if (!existsSync(path)) {
    console.log(`  ! ${suffix}: ${file} missing`);
    missing++;
    continue;
  }
  const asset = await client.assets.upload("image", readFileSync(path), { filename: basename(path) });
  await client.createOrReplace({
    _id: id,
    _type: "galleryImage",
    image: { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt },
    ...(caption ? { caption } : {}),
    order: (made + skipped + 1) * 10,
  });
  console.log(`  + ${suffix}`);
  made++;
}

console.log(`\nGallery: ${made} added, ${skipped} left alone, ${missing} source file(s) not found.`);
