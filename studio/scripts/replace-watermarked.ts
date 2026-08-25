/**
 * Removes photographs belonging to another organisation.
 *
 * The legacy img/highlight imgs/GLC* files and congregation.jpg are
 * watermarked "GREATER LIFE CONFERENCE 2022" and "@YouthForJesusNetwork" —
 * they are Youth For Jesus Network's photographs, not this ministry's. They
 * had been uploaded to the Sunday service slideshow and the gallery.
 *
 * This swaps the service slideshow to WELM-branded photos and deletes the
 * three affected gallery documents.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });
const root = resolve(process.cwd(), "..");

const clean: [string, string][] = [
  ["img/highlight imgs/new1.jpg", "Members of the congregation at the Prophetic and Power Conference"],
  ["img/highlight imgs/new2.jpg", "Worship at a Words of Eternal Life Ministries gathering"],
  ["img/highlight imgs/new3.jpg", "The house gathered for a service"],
  ["img/highlight imgs/ins.jpg", "Dr. Faith Joseph teaching at the Faith Centre"],
  ["img/highlight imgs/ins 2.jpg", "A service at the Faith Centre"],
];

const images: any[] = [];
for (const [file, alt] of clean) {
  const path = resolve(root, file);
  if (!existsSync(path)) { console.log(`  ! missing ${file}`); continue; }
  const asset = await client.assets.upload("image", readFileSync(path), { filename: basename(path) });
  images.push({
    _type: "image",
    _key: asset._id.replace(/[^a-zA-Z0-9]/g, "").slice(-12),
    asset: { _type: "reference", _ref: asset._id },
    alt,
  });
  console.log(`  + ${basename(file)}`);
}

await client.patch("service-revelation-sunday-service").set({ images }).commit();
console.log(`\nSunday slideshow now uses ${images.length} WELM-branded photos.`);

const tainted = ["gallery-worship-1", "gallery-teaching-1", "gallery-congregation-1"];
for (const id of tainted) {
  await client.delete(id).catch(() => {});
  console.log(`  - deleted ${id}`);
}
console.log("\nRemoved 3 gallery photos carrying another organisation's watermark.");
