/**
 * Seeds the Sanity dataset with the content recovered from the legacy site,
 * so none of it has to be retyped.
 *
 * Usage (from studio/):
 *   npm run seed              # create missing documents, leave existing ones
 *   npm run seed -- --replace # overwrite existing documents too
 *
 * Runs through `sanity exec --with-user-token`, which injects the token from
 * `sanity login` into `getCliClient()`. That avoids having to hand-create an
 * API token in sanity.io/manage — you are already authenticated.
 *
 * Safe to re-run: every document has a deterministic `_id` and is written
 * with createIfNotExists unless --replace is passed.
 *
 * Images are NOT uploaded here. The artwork lives in the repo at
 * img/Themes/ and img/Prgrms/ — upload those through the studio once and
 * attach them to the media items. The text is the tedious part.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";

// `sanity/cli` is CommonJS-only. On Node 22+ `sanity exec` runs this file as
// native ESM, and Node's lexer cannot detect that module's named exports, so
// `import { getCliClient }` throws. Going through createRequire works on both
// the native-ESM path and Sanity's own bundler.
const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as {
  getCliClient: (opts: { apiVersion: string }) => any;
};

const replace = process.argv.includes("--replace");

const client = getCliClient({ apiVersion: "2024-10-01" });

// `sanity exec` runs with the studio directory as cwd.
const webData = resolve(process.cwd(), "..", "web", "src", "data");
const read = (file: string) => readFileSync(join(webData, file), "utf8");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Pulls an exported array literal out of a data module.
 *
 * The data files are Astro-side TypeScript that import images, so they
 * cannot simply be imported here — the image specifiers only resolve inside
 * Vite. Reading the literal avoids dragging in that dependency.
 */
function extractArray(source: string, exportName: string): any[] {
  const start = source.indexOf(`export const ${exportName}`);
  if (start === -1) throw new Error(`export ${exportName} not found`);
  // Seek past the `=` first: a type annotation like `: Post[] =` contains a
  // bracket that would otherwise be mistaken for the start of the array.
  const eq = source.indexOf("=", start);
  const open = source.indexOf("[", eq);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "[") depth++;
    else if (source[i] === "]") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  return new Function(`return (${source.slice(open, end + 1)});`)();
}

const aboutSrc = read("about.ts");
const siteSrc = read("site.ts");
const postsSrc = read("posts.ts");

const history = extractArray(aboutSrc, "history");
const faith = extractArray(aboutSrc, "statementOfFaith");
const committee = extractArray(aboutSrc, "committee");
const testimonies = extractArray(aboutSrc, "testimonies");
const services = extractArray(siteSrc, "services");
const themes = extractArray(siteSrc, "themes");
const posts = extractArray(postsSrc, "posts");

const docs: any[] = [
  {
    _id: "siteSettings",
    _type: "siteSettings",
    name: "Kingdom of Gods",
    legalName: "Words of Eternal Life Ministries",
    tagline: "Building You Into The Fullness Of Christ",
    vision: "That men will live like God",
    missionStatement: "Helping many lay hold on eternal life",
    description:
      "Words of Eternal Life Ministries (Kingdom of Gods) — a church in Accra, Ghana building believers into the fullness of Christ.",
    email: "wordsofeternalifemin@gmail.com",
    phones: ["0545195648", "0549480591"],
    addressStreet: "Cambridge Centre of Excellence, Dzorwulu",
    addressCity: "Accra",
    addressCountry: "Ghana",
    facebook: "https://www.facebook.com/wordsofeternallifeministries",
    instagram: "https://www.instagram.com/w_e_l_m/",
    youtube: "https://www.youtube.com/@gracewordtv",
    youtubeChannelId: "UCylwhCv0356yu2sIpuBwIYQ",
  },
];

services.forEach((s, i) =>
  docs.push({
    _id: `service-${slugify(s.name)}`,
    _type: "service",
    name: s.name,
    when: s.when,
    time: s.time,
    where: s.where,
    note: s.note,
    order: (i + 1) * 10,
  }),
);

history.forEach((h, i) =>
  docs.push({
    _id: `history-${i + 1}`,
    _type: "historyEvent",
    dateLabel: h.date,
    title: h.title,
    body: h.body,
    order: (i + 1) * 10,
  }),
);

faith.forEach((f, i) =>
  docs.push({
    _id: `faith-${i + 1}`,
    _type: "faithArticle",
    article: f.article,
    refs: f.refs,
    order: (i + 1) * 10,
  }),
);

committee.forEach((m, i) =>
  docs.push({
    _id: `person-${slugify(m.name)}`,
    _type: "person",
    name: m.name,
    role: m.role,
    onCommittee: true,
    order: (i + 1) * 10,
  }),
);

testimonies.forEach((t, i) =>
  docs.push({
    _id: `testimony-${i + 1}`,
    _type: "testimony",
    name: t.name,
    body: t.body,
    order: (i + 1) * 10,
  }),
);

themes.forEach((t) =>
  docs.push({
    _id: `theme-${t.year}`,
    _type: "yearlyTheme",
    year: t.year,
    title: t.title,
    ...(t.subtitle ? { subtitle: t.subtitle } : {}),
    ...(t.scripture ? { scripture: t.scripture } : {}),
  }),
);

posts.forEach((p) =>
  docs.push({
    _id: `post-${p.slug}`,
    _type: "post",
    title: p.title,
    slug: { _type: "slug", current: p.slug },
    excerpt: p.excerpt,
    ...(p.scripture ? { scripture: p.scripture } : {}),
  }),
);

const counts = docs.reduce<Record<string, number>>((acc, d) => {
  acc[d._type] = (acc[d._type] ?? 0) + 1;
  return acc;
}, {});

const tx = client.transaction();
for (const doc of docs) {
  if (replace) tx.createOrReplace(doc);
  else tx.createIfNotExists(doc);
}

try {
  await tx.commit();
  console.log(
    `\nSeeded ${docs.length} documents into ${client.config().projectId}/${client.config().dataset}:`,
  );
  for (const [type, n] of Object.entries(counts).sort()) {
    console.log(`  ${String(n).padStart(3)}  ${type}`);
  }
  console.log(
    replace
      ? "\nExisting documents were overwritten."
      : "\nExisting documents were left untouched. Re-run with -- --replace to overwrite.",
  );
} catch (error) {
  console.error("\nSeed failed:", error);
  process.exit(1);
}
