/**
 * Attaches the original blog cover images from the legacy `img/blog img/`
 * folder to the matching posts.
 *
 * Skips any post that already has a cover, so a cover uploaded by hand in the
 * Studio is never overwritten. Pass -- --replace to override that.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });
const replace = process.argv.includes("--replace");

const dir = resolve(process.cwd(), "..", "img", "blog img");

const covers: [string, string, string][] = [
  ["post-believe", "belive.webp", "Believe"],
  ["post-who-am-i", "who i am.webp", "Who Am I"],
  ["post-throne-of-grace", "throne-of-grace.webp", "Throne of Grace"],
  ["post-gods-view-of-things", "God's view.webp", "God's View of Things"],
  ["post-eternal-life", "etrl.jpg", "Eternal Life"],
  ["post-god-in-me", "Godinme.webp", "God in Me"],
];

let attached = 0;
let skipped = 0;

for (const [id, file, title] of covers) {
  const doc = await client.getDocument(id);
  if (!doc) {
    console.log(`  ! ${id} not found — run \`npm run seed\` first`);
    continue;
  }
  if (doc.coverImage && !replace) {
    console.log(`  = ${title}: already has a cover, left alone`);
    skipped++;
    continue;
  }
  const path = resolve(dir, file);
  if (!existsSync(path)) {
    console.log(`  ! ${title}: ${file} missing`);
    continue;
  }
  const asset = await client.assets.upload("image", readFileSync(path), {
    filename: basename(path),
  });
  await client
    .patch(id)
    .set({
      coverImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: `Illustration for the post "${title}"`,
      },
    })
    .commit();
  console.log(`  + ${title}`);
  attached++;
}

console.log(`\nAttached ${attached} cover(s); left ${skipped} existing one(s) alone.`);
