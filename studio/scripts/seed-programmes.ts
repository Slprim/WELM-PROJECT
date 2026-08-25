/**
 * Seeds upcoming programmes from the ministry's own event artwork.
 *
 * Recurring programmes are seeded WITHOUT a date, so they always show. The
 * dated conferences from 2023 are seeded with their real dates, which means
 * the carousel filters them out as past — that is correct, and it shows the
 * client exactly how a finished programme drops off on its own.
 *
 * Nothing here is invented: every detail is read off the flyer.
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

type P = {
  id: string;
  file: string;
  alt: string;
  title: string;
  tagline?: string;
  description?: string;
  startDate?: string;
  dateLabel?: string;
  time?: string;
  venue?: string;
  link?: string;
  linkLabel?: string;
  order: number;
};

const programmes: P[] = [
  {
    id: "revelation-service",
    file: "img/Prgrms/RevSunday.jpg",
    alt: "Revelation Service flyer with Prophet Dr. Faith Joseph",
    title: "Revelation Service",
    tagline: "Every Sunday",
    description:
      "The main gathering of the house — worship, the word, and prayer. Everyone is welcome.",
    dateLabel: "Every Sunday",
    time: "9am – 12pm",
    venue: "Cambridge Centre of Excellence, Dzorwulu",
    order: 10,
  },
  {
    id: "time-with-faith-joseph",
    file: "img/Prgrms/Time With FJ.jpg",
    alt: "Time With Faith Joseph flyer",
    title: "Time With Faith Joseph",
    tagline: "Streaming live on GraceWordTV",
    description:
      "A midweek conversation with Dr. Faith Joseph and Pastor Deborah Faith.",
    dateLabel: "Wednesdays",
    time: "8pm GMT",
    venue: "YouTube — GraceWordTV",
    link: "https://www.youtube.com/@gracewordtv",
    linkLabel: "Watch on YouTube",
    order: 20,
  },
  {
    id: "easter-convention-2023",
    file: "img/Prgrms/easter convention .jpg",
    alt: "Easter Convention 2023 flyer with Prophet Dr. Faith Joseph",
    title: "Easter Convention",
    tagline: "Theme: The Death of Jesus Christ",
    description:
      "Morning 8am–11am, afternoon 12noon–2pm, evening 3pm–6pm. Workshop on Easter Monday, 7am–12pm.",
    startDate: "2023-04-07",
    dateLabel: "Friday, 7th April 2023",
    time: "8am – 6pm",
    venue: "Cambridge Centre of Excellence, Dzorwulu",
    order: 30,
  },
  {
    id: "prophetic-and-power-conference-2023",
    file: "img/Prgrms/Pro&Power Conf.jpg",
    alt: "Prophetic and Power Conference flyer",
    title: "Prophetic and Power Conference",
    tagline: "Theme: Light in Darkness",
    startDate: "2023-03-06",
    dateLabel: "Monday, 6th March 2023",
    time: "8am – 2pm",
    venue: "Cambridge Centre of Excellence, Dzorwulu",
    order: 40,
  },
];

let made = 0, skipped = 0;

for (const p of programmes) {
  const id = `programme-${p.id}`;
  if ((await client.getDocument(id)) && !replace) {
    console.log(`  = ${p.title}: exists`);
    skipped++;
    continue;
  }

  const path = resolve(root, p.file);
  if (!existsSync(path)) {
    console.log(`  ! ${p.title}: ${p.file} missing`);
    continue;
  }

  const asset = await client.assets.upload("image", readFileSync(path), {
    filename: basename(path),
  });

  const doc: any = {
    _id: id,
    _type: "programme",
    title: p.title,
    published: true,
    order: p.order,
    image: {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id },
      alt: p.alt,
    },
  };
  for (const k of ["tagline", "description", "startDate", "dateLabel", "time", "venue", "link", "linkLabel"] as const) {
    if (p[k]) doc[k] = p[k];
  }

  await client.createOrReplace(doc);
  console.log(`  + ${p.title}${p.startDate ? `  (dated ${p.startDate} — will be hidden as past)` : "  (ongoing)"}`);
  made++;
}

console.log(`\nProgrammes: ${made} added, ${skipped} left alone.`);
