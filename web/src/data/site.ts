/**
 * Single source of truth for site-wide content.
 *
 * In the legacy site the nav and footer were copy-pasted into all 15 HTML
 * files, which is how they drifted out of sync. Everything shared lives here
 * until it moves into Sanity in Phase 2.
 */

export const site = {
  name: "Kingdom of Gods",
  legalName: "Words of Eternal Life Ministries",
  shortName: "K.O.G",
  tagline: "Building You Into The Fullness Of Christ",
  vision: "That men will live like God",
  description:
    "Words of Eternal Life Ministries (Kingdom of Gods) — a church in Accra, Ghana building believers into the fullness of Christ through teaching, prayer and community.",
  email: "wordsofeternallifemin@gmail.com",
  // The legacy site shipped the placeholder "+012 345 6789". These are the
  // real enquiry lines, taken from the ministry's own event artwork
  // (img/Prgrms/Pro&Power Conf.jpg and img/Themes/Year/Theme 2023.jpg).
  // Worth confirming with the client that both are still in service.
  phones: ["0545195648", "0549480591"],
  /**
   * The meeting place. Changed 2026-09-09 from the Cambridge Centre of
   * Excellence, Dzorwulu.
   *
   * mapsUrl is a search link rather than a dropped pin: a pin needs the
   * venue's real coordinates, which nobody has supplied yet. Replace it with
   * the place URL from Google Maps once someone confirms the exact spot.
   */
  address: {
    street: "Grace Kingdom Auditorium, Seven Days",
    city: "Amasaman, Accra",
    country: "Ghana",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Grace+Kingdom+Auditorium+Seven+Days+Amasaman+Accra",
  },
  social: {
    facebook: "https://www.facebook.com/wordsofeternallifeministries",
    instagram: "https://www.instagram.com/w_e_l_m/",
    /**
     * The channel services stream on and sermons are posted to, confirmed by
     * the ministry 2026-09-09. It is @faithjosephwisalth / "Faith Joseph
     * Wisalth", the same channel as youtubeChannels.streaming.
     *
     * @gracewordtv is a different channel ("GraceWord TV") that the legacy
     * site linked to. Links pointing there sent people to the wrong place.
     */
    youtube: "https://www.youtube.com/@faithjosephwisalth",
  },
  /**
   * The ministry's own artwork bills him as "Prophet Dr. Faith Joseph" and
   * "Lead Pastor"; the legacy site said only "Pst. Faith Joseph". Using the
   * fuller title, but worth confirming which he prefers on the website.
   */
  leader: {
    name: "Dr. Faith Joseph",
    title: "Lead Pastor",
    honorific: "Prophet",
  },
  /** Channels behind the two embeds on the legacy LiveStream page. */
  /**
   * The ministry has two YouTube channels. `streaming` is the one services go
   * out on and the one the media library lists — confirmed 2026-09-09. It is
   * also hard-coded in `public/api/youtube/feed.php`, which cannot import
   * this file; change both together.
   *
   * `primary` is kept because the legacy site used it and older links point
   * at it. Nothing renders from it today.
   */
  youtubeChannels: {
    streaming: "UCxlvklqt9K0AMb4NV18jGsA",
    primary: "UCylwhCv0356yu2sIpuBwIYQ",
    secondary: "UCxlvklqt9K0AMb4NV18jGsA",
  },
} as const;

/** Yearly themes, transcribed from the ministry's own theme artwork. */
export const themes = [
  {
    year: 2023,
    title: "Walking In Great Prosperity And Wealth",
    scripture: "Isaiah 60:1–22",
  },
  {
    year: 2022,
    title: "Winning Souls",
    subtitle: "Grace Upon Grace",
  },
] as const;

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
  /**
   * Leaves this site. Rendered with target="_blank" and an outward arrow so
   * nobody is surprised to land somewhere else, and never marked as the
   * current page.
   */
  external?: boolean;
};

export const nav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "W.E.L.M", href: "/about" },
      { label: "Pastor Faith Joseph", href: "/about/pastor-faith-joseph" },
      { label: "Statement of Faith", href: "/about/statement-of-faith" },
      { label: "Central Committee", href: "/about/central-committee" },
      { label: "Mission & Vision", href: "/about/mission-and-vision" },
    ],
  },
  { label: "Live", href: "/live" },
  { label: "Sermons", href: "/sermons" },
  { label: "Gallery", href: "/gallery" },
  { label: "Blog", href: "/blog" },
  /**
   * The Father's House Prints - the church bookshop. A separate site on a
   * subdomain, sharing the Paystack account; see welm-paystack-golive.
   */
  {
    label: "Bookstore",
    href: "https://thefathershouseprints.kingdomofgods.org",
    external: true,
  },
  { label: "Contact", href: "/contact" },
];

export type Service = {
  name: string;
  when: string;
  time: string;
  where: string;
  note?: string;
  /** e.g. "English" or "Twi". Only shown where it distinguishes two services. */
  language?: string;
};

/**
 * The language label for a gathering.
 *
 * Prefers the Language field set in Sanity. Falls back to reading "Twi" out of
 * the name, for services created before that field existed; anything else is
 * assumed to be in English.
 *
 * This lives here rather than in each page because it was written inline in a
 * template once and silently returned the wrong answer - a regex literal
 * inside a JSX expression is not worth the risk when the result is a label
 * telling people which service to attend.
 */
export function serviceLanguage(s: {
  name: string;
  language?: string | null;
}): string {
  if (s.language) return s.language;
  return /twi/i.test(s.name) ? "Twi" : "English";
}

/**
 * Pulled from the legacy homepage. The "Sataurday" typo in the original
 * source is corrected here.
 */
export const services: Service[] = [
  {
    name: "Twi Service",
    when: "Every Sunday",
    time: "7 am – 8:30 am",
    where: "In person",
    language: "Twi",
    note: "The Sunday gathering held in Twi.",
  },
  {
    name: "Revelation Sunday Service",
    when: "Every Sunday",
    language: "English",
    // Kept in step with the Sanity `service` document, which is what the site
    // actually renders. This list is only the fallback for a build with no
    // CMS configured, but a fallback that disagrees is worse than none.
    time: "9:00 am – 12:00 pm",
    where: "In person",
    note: "Our main gathering for teaching and worship.",
  },
  {
    name: "Declaration Hour",
    when: "Monday – Saturday",
    time: "5:00 – 6:00 am",
    where: "Online",
    note: "Start the day in the word and in prayer.",
  },
  {
    name: "Lunch Hour",
    when: "Monday – Saturday",
    time: "12:00 noon",
    where: "Online",
    note: "A midday pause for scripture and intercession.",
  },
  {
    name: "I AM GOD",
    when: "Every day",
    time: "5:00 pm",
    where: "Online",
    note: "Daily teaching on identity in Christ.",
  },
  {
    name: "K.O.G Bible Studies",
    when: "Weekly",
    time: "8:30 – 9:30 pm",
    where: "In person",
    note: "Verse-by-verse study of the scriptures.",
  },
  {
    name: "Dominion All Night",
    when: "Monthly",
    time: "10:00 pm – 4:00 am",
    where: "In person",
    note: "A night of corporate prayer and worship.",
  },
  {
    name: "Metadidomi",
    when: "Every 30th of the month",
    time: "See announcements",
    where: "In person",
    note: "Our monthly giving and impartation service.",
  },
];
