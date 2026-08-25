/**
 * Uploads the Sunday-service photos from the legacy `img/highlight imgs/`
 * folder and attaches them to the Revelation Sunday Service document, so the
 * home page slideshow is populated and editable in the Studio from day one.
 *
 * Usage:  npm run upload:service-images
 *
 * Idempotent: skips upload entirely if the document already has images,
 * unless -- --replace is passed.
 */
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });
const replace = process.argv.includes("--replace");

const DOC_ID = "service-revelation-sunday-service";

const files = [
  ["GLC488-21.jpg", "The congregation worshipping during a Sunday service"],
  ["GLC605-18.jpg", "Pastor Faith Joseph teaching on a Sunday morning"],
  ["GLC606-19.jpg", "The congregation gathered for worship"],
  ["new1.jpg", "Members of the congregation during a Sunday service"],
  ["new2.jpg", "Worship at a Sunday morning gathering"],
  ["new3.jpg", "The house gathered on a Sunday"],
];

const dir = resolve(process.cwd(), "..", "img", "highlight imgs");

const existing = await client.getDocument(DOC_ID);
if (!existing) {
  console.error(`Document ${DOC_ID} not found. Run \`npm run seed\` first.`);
  process.exit(1);
}
if (existing.images?.length && !replace) {
  console.log(
    `${DOC_ID} already has ${existing.images.length} image(s). Nothing to do.\n` +
      "Re-run with -- --replace to overwrite them.",
  );
  process.exit(0);
}

const images: any[] = [];
for (const [file, alt] of files) {
  const path = resolve(dir, file);
  const asset = await client.assets.upload("image", readFileSync(path), {
    filename: basename(path),
  });
  images.push({
    _type: "image",
    _key: randomUUID().replace(/-/g, "").slice(0, 16),
    asset: { _type: "reference", _ref: asset._id },
    alt,
  });
  console.log(`  uploaded ${file}`);
}

await client.patch(DOC_ID).set({ images }).commit();
console.log(`\nAttached ${images.length} images to ${DOC_ID}.`);
