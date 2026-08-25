/**
 * Repairs duplicate `_key` values in image arrays.
 *
 * Keys were generated from the tail of the asset id, which is
 * "WIDTHxHEIGHT-format" — so any two photos with the same dimensions produced
 * the same key. Sanity requires array keys to be unique: duplicates break
 * drag-to-reorder and can apply an edit or delete to the wrong item.
 *
 * Rewrites every image array with random keys. Idempotent and safe to re-run.
 */
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });

const docs = await client.fetch(
  `*[defined(images) && count(images) > 0]{ _id, _type, images }`,
);

let fixed = 0;

for (const doc of docs as any[]) {
  const keys = doc.images.map((i: any) => i._key);
  const unique = new Set(keys);
  const hasDupes = unique.size !== keys.length;
  const hasMissing = keys.some((k: string) => !k);

  if (!hasDupes && !hasMissing) {
    console.log(`  = ${doc._id}: ${keys.length} keys already unique`);
    continue;
  }

  const images = doc.images.map((image: any) => ({
    ...image,
    _key: randomUUID().replace(/-/g, "").slice(0, 16),
  }));

  await client.patch(doc._id).set({ images }).commit();
  console.log(
    `  + ${doc._id}: rewrote ${images.length} keys (${keys.length - unique.size} were duplicates)`,
  );
  fixed++;
}

console.log(`\n${fixed} document(s) repaired.`);
