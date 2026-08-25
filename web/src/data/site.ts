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
  email: "wordsofeternalifemin@gmail.com",
  // The legacy site shipped the placeholder "+012 345 6789". These are the
  // real enquiry lines, taken from the ministry's own event artwork
  // (img/Prgrms/Pro&Power Conf.jpg and img/Themes/Year/Theme 2023.jpg).
  // Worth confirming with the client that both are still in service.
  phones: ["0545195648", "0549480591"],
  address: {
    street: "Cambridge Centre of Excellence, Dzorwulu",
    city: "Accra",
    country: "Ghana",
    mapsUrl:
      "https://www.google.com/maps/place/Cambridge+Center+of+Ex...+Dzorwulu/@5.6029428,-0.2118874,17z",
  },
  social: {
    facebook: "https://www.facebook.com/wordsofeternallifeministries",
    instagram: "https://www.instagram.com/w_e_l_m/",
    youtube: "https://www.youtube.com/@gracewordtv",
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
  youtubeChannels: {
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
  { label: "Contact", href: "/contact" },
];

export type Service = {
  name: string;
  when: string;
  time: string;
  where: string;
  note?: string;
};

/**
 * Pulled from the legacy homepage. The "Sataurday" typo in the original
 * source is corrected here.
 */
export const services: Service[] = [
  {
    name: "Revelation Sunday Service",
    when: "Every Sunday",
    time: "8:00 – 10:00 am",
    where: "In person",
    note: "Our main gathering for teaching and worship.",
  },
  {
    name: "Declaration Hour",
    when: "Monday – Saturday",
    time: "5:00 – 6:00 am",
    where: "Clubhouse",
    note: "Start the day in the word and in prayer.",
  },
  {
    name: "Lunch Hour",
    when: "Monday – Saturday",
    time: "12:00 noon",
    where: "Clubhouse",
    note: "A midday pause for scripture and intercession.",
  },
  {
    name: "I AM GOD",
    when: "Every day",
    time: "5:00 pm",
    where: "Clubhouse",
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
