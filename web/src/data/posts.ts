/**
 * Blog posts carried over from `blog.html`.
 *
 * These are the ministry's own words. The legacy site published no dates or
 * authors on any post, so those fields are null and the UI omits them rather
 * than inventing a publication date. Titles have been detypo'd ("Belive" →
 * "Believe") and de-slugged ("who-am-i" → "Who Am I"); the body text is
 * otherwise untouched apart from Windows smart-quote characters that the
 * original encoded incorrectly.
 *
 * Each `excerpt` is the full text the legacy card carried — the old "Read
 * More" links went nowhere, so there is no further body to import. Full
 * posts need to come from the client or be written in the CMS.
 */

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  scripture: string | null;
  date: string | null;
  author: string | null;
};

export const posts: Post[] = [
  {
    slug: "believe",
    title: "Believe",
    excerpt:
      "You believe that Jesus can heal you, but you don't believe He can take away your sins — past, present and future? Then you need to beef up your knowledge about Jesus Christ of Nazareth.",
    scripture: null,
    date: null,
    author: null,
  },
  {
    slug: "who-am-i",
    title: "Who Am I",
    excerpt:
      "It's not bad to find out from your friends who they see you to be. The world, and even some Christians, say it is necessary for a better knowledge of yourself. I wouldn't say it is bad or good. The only question is: who are your friends — spiritual or carnal?",
    scripture: "Matthew 16:13–19",
    date: null,
    author: null,
  },
  {
    slug: "throne-of-grace",
    title: "Throne of Grace",
    excerpt:
      "Many have cried to God for help in every area of their lives and felt very frustrated because they didn't get the results they expected. One reason is that they have a wrong idea of where and how to get the grace to help.",
    scripture: null,
    date: null,
    author: null,
  },
  {
    slug: "gods-view-of-things",
    title: "God's View of Things",
    excerpt:
      "God, in the time of Adam, looked at all men through Adam. But now, He beholds all things in Jesus, who is the second and last Adam. Take a moment and think about this today. What does that mean to you?",
    scripture: null,
    date: null,
    author: null,
  },
  {
    slug: "eternal-life",
    title: "Eternal Life",
    excerpt:
      "And this is the record: that God hath given to us eternal life, and this life is in his Son.",
    scripture: "1 John 5:11",
    date: null,
    author: null,
  },
  {
    slug: "god-in-me",
    title: "God in Me",
    excerpt:
      "Moses, in the old covenant, said something which is blindly followed by children of God. Moses had to pray for the presence of God to go with him — “If thy presence go not with me, carry us not up hence.”",
    scripture: "Exodus 33:15",
    date: null,
    author: null,
  },
];
