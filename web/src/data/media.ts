import theme2023 from "../assets/media/theme-2023.jpg";
import theme2022 from "../assets/media/theme-2022.jpg";
import propheticPower from "../assets/media/prophetic-power-conference.jpg";
import aug2023 from "../assets/media/aug-2023.jpg";
import october from "../assets/media/october.jpg";
import godhood from "../assets/media/godhood.jpg";

/**
 * Media library content.
 *
 * IMPORTANT — everything here is transcribed from the ministry's own
 * artwork in `img/Themes/` and `img/Prgrms/`. No sermon titles, dates,
 * speakers or durations have been invented. Where a real value is unknown
 * the field is left null and the UI omits it rather than showing a guess.
 *
 * The shape deliberately mirrors what the Sanity `sermon` document will
 * look like, so Phase 2 is a source swap rather than a rewrite.
 */

export type MediaKind = "video" | "audio" | "series";

export type MediaItem = {
  slug: string;
  title: string;
  /** Null where the artwork does not name a speaker. */
  speaker: string | null;
  series: string;
  kind: MediaKind;
  /** ISO date, or null when only a year/month is known. */
  date: string | null;
  /** Free-text when an exact date is not published. */
  dateLabel: string;
  scripture: string | null;
  summary: string | null;
  image: ImageMetadata;
  /** Populated once the YouTube/audio IDs are supplied by the client. */
  url: string | null;
};

export const series = [
  "Yearly Theme",
  "Conferences",
  "Monthly Theme",
  "Teachings",
] as const;

export const mediaItems: MediaItem[] = [
  {
    slug: "prophetic-and-power-conference-2023",
    title: "Prophetic and Power Conference",
    speaker: "Prophet Dr. Faith Joseph",
    series: "Conferences",
    kind: "video",
    date: "2023-03-06",
    dateLabel: "6 March 2023",
    scripture: null,
    summary: "Theme: Light in Darkness. Held 8am – 2pm at the Cambridge Centre of Excellence, Dzorwulu.",
    image: propheticPower,
    url: null,
  },
  {
    slug: "year-of-walking-in-great-prosperity-and-wealth",
    title: "Walking In Great Prosperity And Wealth",
    speaker: "Prophet Dr. Faith Joseph",
    series: "Yearly Theme",
    kind: "series",
    date: null,
    dateLabel: "2023",
    scripture: "Isaiah 60:1–22",
    summary: "The word over the house for the year, taught across every gathering.",
    image: theme2023,
    url: null,
  },
  {
    slug: "year-of-winning-souls",
    title: "Winning Souls",
    speaker: "Prophet Dr. Faith Joseph",
    series: "Yearly Theme",
    kind: "series",
    date: null,
    dateLabel: "2022",
    scripture: null,
    summary: "Grace upon grace — the year the house gave itself to the harvest.",
    image: theme2022,
    url: null,
  },
  {
    slug: "godhood",
    title: "Godhood",
    speaker: null,
    series: "Teachings",
    kind: "audio",
    date: null,
    dateLabel: "Undated",
    scripture: null,
    summary: null,
    image: godhood,
    url: null,
  },
  {
    slug: "month-of-august-2023",
    title: "August 2023",
    speaker: null,
    series: "Monthly Theme",
    kind: "series",
    date: null,
    dateLabel: "August 2023",
    scripture: null,
    summary: null,
    image: aug2023,
    url: null,
  },
  {
    slug: "month-of-october",
    title: "Month of October",
    speaker: null,
    series: "Monthly Theme",
    kind: "series",
    date: null,
    dateLabel: "October",
    scripture: null,
    summary: null,
    image: october,
    url: null,
  },
];
