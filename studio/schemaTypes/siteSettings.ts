import { defineField, defineType } from "sanity";

/**
 * Singleton holding everything that used to be duplicated across all 15
 * legacy HTML files — contact details, social links, service address.
 * Editing it here updates every page at once.
 */
export default defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact" },
    { name: "social", title: "Social" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Short name",
      type: "string",
      group: "identity",
      initialValue: "Kingdom of Gods",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "legalName",
      title: "Full registered name",
      type: "string",
      group: "identity",
      initialValue: "Words of Eternal Life Ministries",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      type: "string",
      group: "identity",
      initialValue: "Building You Into The Fullness Of Christ",
    }),
    defineField({
      name: "vision",
      type: "string",
      group: "identity",
      initialValue: "That men will live like God",
    }),
    defineField({
      name: "missionStatement",
      title: "Mission statement",
      type: "string",
      group: "identity",
      initialValue: "Helping many lay hold on eternal life",
    }),
    defineField({
      name: "description",
      title: "Default search-engine description",
      type: "text",
      rows: 3,
      group: "identity",
      description:
        "Used when a page has no description of its own. Keep it under about 160 characters.",
      validation: (r) => r.max(200),
    }),
    defineField({
      name: "email",
      type: "string",
      group: "contact",
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: "phones",
      title: "Phone numbers",
      type: "array",
      of: [{ type: "string" }],
      group: "contact",
      description:
        "Four different numbers appeared across the old site. List only the ones that are actually in service.",
    }),
    defineField({
      name: "addressStreet",
      title: "Street / venue",
      type: "string",
      group: "contact",
    }),
    defineField({ name: "addressCity", title: "City", type: "string", group: "contact" }),
    defineField({
      name: "addressCountry",
      title: "Country",
      type: "string",
      group: "contact",
      initialValue: "Ghana",
    }),
    defineField({
      name: "mapsUrl",
      title: "Google Maps link",
      type: "url",
      group: "contact",
    }),
    defineField({ name: "facebook", type: "url", group: "social" }),
    defineField({ name: "instagram", type: "url", group: "social" }),
    defineField({ name: "youtube", type: "url", group: "social" }),
    defineField({
      name: "youtubeChannelId",
      title: "YouTube channel ID",
      type: "string",
      group: "social",
      description:
        "Used by the live player. Looks like UCylwhCv0356yu2sIpuBwIYQ — not the @handle.",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Site settings" }),
  },
});
