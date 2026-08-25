/**
 * Seeds the two document types that were left empty: media items and FAQs.
 *
 * Media items carry their artwork, uploaded from the ministry's own theme and
 * event graphics in img/Themes and img/Prgrms. Speakers are linked to the
 * existing person records rather than duplicated as strings.
 *
 * Idempotent — existing documents are left alone unless -- --replace.
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";

const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };
const client = getCliClient({ apiVersion: "2024-10-01" });
const replace = process.argv.includes("--replace");

const root = resolve(process.cwd(), "..");
const FJ = "person-dr-faith-joseph";

type Media = {
  slug: string; title: string; kind: string; series: string;
  speaker?: string; date?: string; dateLabel?: string;
  scripture?: string; summary?: string; featured?: boolean;
  file: string; alt: string;
};

const media: Media[] = [
  {
    slug: "prophetic-and-power-conference-2023",
    title: "Prophetic and Power Conference",
    kind: "video", series: "Conferences", speaker: FJ,
    date: "2023-03-06", dateLabel: "6 March 2023",
    summary: "Theme: Light in Darkness. Held 8am – 2pm at the Cambridge Centre of Excellence, Dzorwulu.",
    featured: true,
    file: "img/Prgrms/Pro&Power Conf.jpg",
    alt: "Poster for the Prophetic and Power Conference with Prophet Dr. Faith Joseph",
  },
  {
    slug: "year-of-walking-in-great-prosperity-and-wealth",
    title: "Walking In Great Prosperity And Wealth",
    kind: "series", series: "Yearly Theme", speaker: FJ,
    dateLabel: "2023", scripture: "Isaiah 60:1–22",
    summary: "The word over the house for the year, taught across every gathering.",
    file: "img/Themes/Year/Theme 2023.jpg",
    alt: "2023 yearly theme artwork: Walking In Great Prosperity And Wealth",
  },
  {
    slug: "year-of-winning-souls",
    title: "Winning Souls",
    kind: "series", series: "Yearly Theme", speaker: FJ,
    dateLabel: "2022",
    summary: "Grace upon grace — the year the house gave itself to the harvest.",
    file: "img/Themes/Year/Theme 2022.jpg",
    alt: "2022 yearly theme artwork: Winning Souls, Grace Upon Grace",
  },
  {
    slug: "godhood",
    title: "Godhood",
    kind: "audio", series: "Teachings", speaker: FJ,
    dateLabel: "Every Monday",
    summary: "A live radio broadcast with Dr. Faith Joseph, going out every Monday on Hitz.",
    file: "img/Prgrms/GOD hood.jpg",
    alt: "Artwork for the Godhood live radio broadcast",
  },
  {
    slug: "month-of-august-2023",
    title: "Making A Practise Of The Word Of God",
    kind: "series", series: "Monthly Theme",
    dateLabel: "August 2023",
    file: "img/Themes/Month/Aug 2023.jpg",
    alt: "August 2023 monthly theme artwork",
  },
  {
    slug: "month-of-october",
    title: "Thanking God For The Little",
    kind: "series", series: "Monthly Theme",
    dateLabel: "October",
    summary: "Thanking God for the little, and using them to do great things.",
    file: "img/Themes/Month/Month of October.jpg",
    alt: "October monthly theme artwork",
  },
];

let made = 0, skipped = 0;

for (const m of media) {
  const id = `sermon-${m.slug}`;
  const existing = await client.getDocument(id);
  if (existing && !replace) { console.log(`  = ${m.title}: exists`); skipped++; continue; }

  const path = resolve(root, m.file);
  if (!existsSync(path)) { console.log(`  ! ${m.title}: ${m.file} missing`); continue; }
  const asset = await client.assets.upload("image", readFileSync(path), { filename: basename(path) });

  const doc: any = {
    _id: id, _type: "sermon",
    title: m.title,
    slug: { _type: "slug", current: m.slug },
    kind: m.kind, series: m.series,
    dateLabel: m.dateLabel,
    featured: Boolean(m.featured),
    image: { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: m.alt },
  };
  if (m.speaker) doc.speaker = { _type: "reference", _ref: m.speaker };
  if (m.date) doc.date = m.date;
  if (m.scripture) doc.scripture = m.scripture;
  if (m.summary) doc.summary = m.summary;

  await client.createOrReplace(doc);
  console.log(`  + ${m.title}`);
  made++;
}

// ── FAQs ───────────────────────────────────────────────────────────────
const faqs: [string, string, boolean][] = [
  ["When and where do you meet?", "Revelation Sunday Service runs 8:00 – 10:00 am every Sunday at the Cambridge Centre of Excellence, Dzorwulu, Accra. There are also gatherings every weekday — the Declaration Hour at 5:00 am, Lunch Hour at noon and I AM GOD at 5:00 pm.", true],
  ["I have never been to a service before. What happens?", "Sunday is a teaching service — worship, then the word, and prayer. You are welcome to come exactly as you are, sit wherever you like, and leave whenever you need to. Nobody will single you out.", true],
  ["Can I join online instead?", "Yes. Sunday services stream on the ministry's YouTube channel. The Live page has everything in one place.", true],
  ["What does this church believe?", "The house holds to ten articles of faith, each anchored in scripture — from the authority of the Bible through to healing, baptism and prosperity. The full statement is published on this site.", true],
  ["How do I give?", "Giving will be available by mobile money — MTN MoMo, Telecel Cash and AT Money — as well as by card and bank transfer, through Paystack. You can also give in person at any gathering.", true],
  ["Can I request prayer?", "Yes. Send a prayer request through the contact page and it goes to the pastoral team. Requests are treated as private.", true],
  ["Who leads the ministry?", "Dr. Faith Joseph founded the ministry and serves as its head pastor and President of the Central Committee — the governing body constituted in 2019. The full committee is listed on this site.", true],
  ["How do I get in touch?", "Call 0545195648 or 0549480591, email wordsofeternalifemin@gmail.com, or use the contact form.", true],
  // Unpublished: these need the ministry's own policy before they go live.
  ["Is there provision for children during the service?", "", false],
  ["How do I become a member?", "", false],
  ["How do I get baptised?", "", false],
  ["Is there parking at the venue?", "", false],
  ["How do I join a department or serve?", "", false],
];

const tx = client.transaction();
faqs.forEach(([q, a, published], i) => {
  const doc = {
    _id: `faq-${i + 1}`, _type: "faq",
    question: q,
    answer: a || "This still needs an answer from the ministry.",
    order: (i + 1) * 10,
    published,
  };
  if (replace) tx.createOrReplace(doc); else tx.createIfNotExists(doc);
});
await tx.commit();

console.log(`\nMedia: ${made} created, ${skipped} left alone.`);
console.log(`FAQs: ${faqs.length} (${faqs.filter((f) => f[2]).length} published, ${faqs.filter((f) => !f[2]).length} held back for a real answer).`);
