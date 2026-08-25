import { defineField, defineType } from "sanity";

/**
 * The word over the house for one month, shown on the home page.
 *
 * Because the site is on hosting with no build server, a theme cannot start
 * showing by itself on the 1st unless someone rebuilds. So the page renders
 * every theme it knows about and picks the right one in the browser by date.
 * That means several months can be prepared in advance and each will appear
 * on time without anyone touching the server.
 */
export default defineType({
  name: "monthlyTheme",
  title: "Theme of the month",
  type: "document",
  fields: [
    defineField({
      name: "month",
      title: "Month",
      type: "date",
      options: { dateFormat: "MMMM YYYY" },
      description:
        "Pick any day in the month this theme belongs to — only the month and year are used.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "title",
      title: "The theme",
      type: "string",
      description: 'e.g. "Making A Practise Of The Word Of God"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "scripture",
      type: "string",
      description: 'Optional. e.g. "Joshua 1:8"',
    }),
    defineField({
      name: "note",
      title: "Short description",
      type: "text",
      rows: 3,
      description: "Optional. A sentence or two under the theme.",
    }),
    defineField({
      name: "artwork",
      type: "image",
      options: { hotspot: true },
      description: "The month's theme graphic. Optional but recommended.",
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          validation: (r) => r.required(),
        }),
      ],
    }),
  ],
  orderings: [
    { title: "Newest first", name: "monthDesc", by: [{ field: "month", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "month", media: "artwork" },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle
        ? new Date(subtitle).toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })
        : "No month set",
      media,
    }),
  },
});
