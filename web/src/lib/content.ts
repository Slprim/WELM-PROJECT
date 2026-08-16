import { query, enabled } from "./sanity";
import { site as localSite, themes as localThemes, type Service } from "../data/site";
import { services as localServices } from "../data/site";
import {
  history as localHistory,
  statementOfFaith as localFaith,
  committee as localCommittee,
  testimonies as localTestimonies,
} from "../data/about";
import { posts as localPosts, type Post } from "../data/posts";

/**
 * The single place pages get their content from.
 *
 * Each getter asks Sanity first and falls back to the checked-in data when
 * the CMS is not configured, is unreachable, or simply has no records of
 * that type yet. Pages import from here and never know which happened.
 *
 * An empty array from Sanity is treated as "nothing published yet" and also
 * falls back — otherwise connecting an empty CMS would blank the live site.
 */
const useOr = <T>(remote: T[] | null, local: T[]): T[] =>
  remote && remote.length > 0 ? remote : local;

export { enabled as cmsEnabled };

export async function getSiteSettings() {
  const remote = await query<{
    name?: string;
    legalName?: string;
    tagline?: string;
    vision?: string;
    description?: string;
    email?: string;
    phones?: string[];
    addressStreet?: string;
    addressCity?: string;
    addressCountry?: string;
    mapsUrl?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    youtubeChannelId?: string;
  }>(`*[_type == "siteSettings"][0]`);

  if (!remote) return localSite;

  return {
    ...localSite,
    name: remote.name ?? localSite.name,
    legalName: remote.legalName ?? localSite.legalName,
    tagline: remote.tagline ?? localSite.tagline,
    vision: remote.vision ?? localSite.vision,
    description: remote.description ?? localSite.description,
    email: remote.email ?? localSite.email,
    phones: remote.phones?.length ? remote.phones : localSite.phones,
    address: {
      street: remote.addressStreet ?? localSite.address.street,
      city: remote.addressCity ?? localSite.address.city,
      country: remote.addressCountry ?? localSite.address.country,
      mapsUrl: remote.mapsUrl ?? localSite.address.mapsUrl,
    },
    social: {
      facebook: remote.facebook ?? localSite.social.facebook,
      instagram: remote.instagram ?? localSite.social.instagram,
      youtube: remote.youtube ?? localSite.social.youtube,
    },
    youtubeChannels: {
      ...localSite.youtubeChannels,
      primary: remote.youtubeChannelId ?? localSite.youtubeChannels.primary,
    },
  };
}

export async function getServices(): Promise<Service[]> {
  const remote = await query<Service[]>(
    `*[_type == "service"] | order(order asc) { name, when, time, where, note }`,
  );
  return useOr(remote, localServices as unknown as Service[]);
}

export async function getHistory() {
  const remote = await query<{ date: string; title: string; body: string }[]>(
    `*[_type == "historyEvent"] | order(order asc) { "date": dateLabel, title, body }`,
  );
  return useOr(remote, localHistory);
}

export async function getStatementOfFaith() {
  const remote = await query<{ article: string; refs: string }[]>(
    `*[_type == "faithArticle"] | order(order asc) { article, refs }`,
  );
  return useOr(remote, localFaith);
}

export async function getCommittee() {
  const remote = await query<{ name: string; role: string }[]>(
    `*[_type == "person" && onCommittee == true] | order(order asc) { name, role }`,
  );
  return useOr(remote, localCommittee);
}

export async function getTestimonies() {
  const remote = await query<{ name: string; body: string }[]>(
    `*[_type == "testimony"] | order(order asc) { name, body }`,
  );
  return useOr(remote, localTestimonies);
}

export type Theme = {
  year: number;
  title: string;
  subtitle?: string;
  scripture?: string;
};

export async function getThemes(): Promise<Theme[]> {
  const remote = await query<Theme[]>(
    `*[_type == "yearlyTheme"] | order(year desc) { year, title, subtitle, scripture }`,
  );
  // `localThemes` is `as const`, so widen it to the mutable shape.
  return useOr(remote, localThemes.map((t) => ({ ...t })) as Theme[]);
}

export async function getPosts(): Promise<Post[]> {
  const remote = await query<Post[]>(
    `*[_type == "post"] | order(coalesce(publishedAt, _createdAt) desc) {
       "slug": slug.current, title, excerpt, scripture,
       "date": publishedAt, "author": author->name
     }`,
  );
  return useOr(remote, localPosts);
}

export async function getFaqs() {
  const remote = await query<{ q: string; a: string }[]>(
    `*[_type == "faq" && published == true] | order(order asc) { "q": question, "a": answer }`,
  );
  // No local fallback here: faq.astro composes its own answers from other
  // facts, so it passes its list in and only overrides when the CMS has one.
  return remote && remote.length > 0 ? remote : null;
}
