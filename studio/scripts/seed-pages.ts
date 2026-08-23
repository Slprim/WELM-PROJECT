/**
 * Creates the one page-header document per page that structure.ts opens.
 * Idempotent: re-running leaves any edits alone unless -- --replace.
 */
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getCliClient } = require("sanity/cli") as { getCliClient: (o: any) => any };

const client = getCliClient({ apiVersion: "2024-10-01" });
const replace = process.argv.includes("--replace");

const pages = [
  { id: "home", eyebrow: "Welcome to", title: "Kingdom of Gods", lede: "Words of Eternal Life Ministries. Building You Into The Fullness Of Christ.", seoDescription: "Words of Eternal Life Ministries (Kingdom of Gods) — a church in Accra, Ghana building believers into the fullness of Christ." },
  { id: "about", eyebrow: "About the house", title: "It began with fifty people in a café", lede: "Words of Eternal Life Ministries has been gathering in Accra since 2012. This is how it started, and what it has become.", seoDescription: "Words of Eternal Life Ministries was inaugurated in Accra in August 2012. Read how the house began, what it believes, and who leads it." },
  { id: "pastor", eyebrow: "Our leader", title: "Pastor Faith Joseph", lede: "A pastor, prophet and author based in Accra, Ghana, and the founder and Head Pastor of Words of Eternal Life Ministries.", seoDescription: "Dr. Faith Joseph — founder and Head Pastor of Words of Eternal Life Ministries, Accra." },
  { id: "statement-of-faith", eyebrow: "Statement of Faith", title: "What this house holds to", lede: "Ten articles, each anchored in scripture.", seoDescription: "The ten articles Words of Eternal Life Ministries holds to, and the scriptures behind each one." },
  { id: "central-committee", eyebrow: "Central Committee", title: "The governing body of the ministry", lede: "Constituted in 2019 to oversee the work of the house.", seoDescription: "The Central Committee is the governing body of Words of Eternal Life Ministries, constituted in 2019." },
  { id: "mission-and-vision", eyebrow: "Mission & Vision", title: "Why this house exists", seoDescription: "Why Words of Eternal Life Ministries exists, where it is going, and the yearly themes the house has walked through." },
  { id: "sermons", eyebrow: "Media Library", title: "Catch up on the word", lede: "Every teaching, conference and theme the house has walked through — in one place.", seoDescription: "Teachings, conferences and yearly themes from Words of Eternal Life Ministries in Accra." },
  { id: "blog", eyebrow: "Blog", title: "Short words, worth sitting with", lede: "Reflections from the house — on grace, identity, and the life God has already given.", seoDescription: "Short teachings and reflections from Words of Eternal Life Ministries — on grace, identity in Christ, and eternal life." },
  { id: "live", eyebrow: "Live", title: "Join us from wherever you are", lede: "Sunday services stream on YouTube. The daily gatherings run on Clubhouse.", seoDescription: "Join Words of Eternal Life Ministries live — Sunday services, the 5am Declaration Hour and daily teachings." },
  { id: "faq", eyebrow: "FAQs", title: "Questions people ask", lede: "If your question is not here, the contact page will reach a real person.", seoDescription: "Common questions about visiting Words of Eternal Life Ministries — service times, location, what to expect, giving and prayer." },
  { id: "contact", eyebrow: "Contact", title: "We would love to hear from you", lede: "Whether you are planning a first visit or asking for prayer, there is someone here to answer.", seoDescription: "Get in touch with Words of Eternal Life Ministries in Accra — visit us on Sunday, request prayer, or send a message." },
  { id: "give", eyebrow: "Metadidomi", title: "Every seed sown here goes somewhere", lede: "Your giving funds the teaching, the outreach and the running of the house. Give once, or set up a standing gift.", seoDescription: "Give to Words of Eternal Life Ministries by mobile money or card. Tithes, offerings, Metadidomi, missions and the building fund." },
];

const tx = client.transaction();
for (const p of pages) {
  const doc = { _id: `page-${p.id}`, _type: "page", title: p.title, eyebrow: p.eyebrow, lede: p.lede, seoDescription: p.seoDescription };
  if (replace) tx.createOrReplace(doc); else tx.createIfNotExists(doc);
}
await tx.commit();
console.log(`\nSeeded ${pages.length} page headings.`);
