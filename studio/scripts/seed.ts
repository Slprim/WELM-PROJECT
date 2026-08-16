/**
 * Seeds a fresh Sanity dataset with the content already recovered from the
 * legacy site, so nobody has to retype it.
 *
 * Usage:
 *   cd studio
 *   npm install
 *   export SANITY_STUDIO_PROJECT_ID=<id>          # or set in .env
 *   export SANITY_WRITE_TOKEN=<editor token>      # sanity.io/manage → API → Tokens
 *   npm run seed
 *
 * Safe to re-run: every document uses a deterministic `_id` and
 * `createIfNotExists`, so existing records are left alone. Pass --replace to
 * overwrite them instead.
 *
 * Images are NOT uploaded here — the media items reference artwork that
 * lives in the repo at img/Themes and img/Prgrms. Upload those through the
 * studio once and attach them; the text is the tedious part.
 */
import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";
const token = process.env.SANITY_WRITE_TOKEN;
const replace = process.argv.includes("--replace");

if (!projectId || !token) {
  console.error(
    "Missing SANITY_STUDIO_PROJECT_ID or SANITY_WRITE_TOKEN.\n" +
      "Create the project with `npx sanity init --env`, then generate an\n" +
      "Editor token at sanity.io/manage → API → Tokens.",
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2024-10-01",
  useCdn: false,
});

const here = dirname(fileURLToPath(import.meta.url));
const webData = join(here, "..", "..", "web", "src", "data");

/**
 * The data files are TypeScript modules meant for Astro, so rather than
 * importing them (and dragging in image imports that only resolve inside
 * Vite) the seed reads the literals it needs directly.
 */
const read = (file: string) => readFileSync(join(webData, file), "utf8");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Pulls an exported array literal out of a data module via JSON-ish parse. */
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
  const literal = source.slice(open, end + 1);
  // The literals are plain data with trailing commas and unquoted keys.
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
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

const docs: any[] = [];

docs.push({
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
});

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
    subtitle: t.subtitle,
    scripture: t.scripture,
  }),
);

posts.forEach((p) =>
  docs.push({
    _id: `post-${p.slug}`,
    _type: "post",
    title: p.title,
    slug: { _type: "slug", current: p.slug },
    excerpt: p.excerpt,
    scripture: p.scripture ?? undefined,
  }),
);

const tx = client.transaction();
for (const doc of docs) {
  if (replace) tx.createOrReplace(doc);
  else tx.createIfNotExists(doc);
}

const counts = docs.reduce<Record<string, number>>((acc, d) => {
  acc[d._type] = (acc[d._type] ?? 0) + 1;
  return acc;
}, {});

try {
  await tx.commit();
  console.log(`Seeded ${docs.length} documents into ${projectId}/${dataset}:`);
  for (const [type, n] of Object.entries(counts)) console.log(`  ${n.toString().padStart(3)}  ${type}`);
  if (!replace) console.log("\nExisting documents were left untouched. Use --replace to overwrite.");
} catch (error) {
  console.error("Seed failed:", error);
  process.exit(1);
}
