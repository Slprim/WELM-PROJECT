import { defineField, defineType } from "sanity";

/**
 * The editable header of one page — the small label, the big heading and the
 * paragraph underneath it.
 *
 * One document per page, each with a fixed `_id` (`page-home`, `page-blog`
 * and so on) so the structure can open it directly instead of showing a list
 * to pick from. Staff never create these; they only edit the ones that exist.
 */
export default defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Main heading",
      type: "string",
      description: "The large heading at the top of the page.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "eyebrow",
      title: "Small label above the heading",
      type: "string",
      description: 'The short gold text, e.g. "Media Library".',
    }),
    defineField({
      name: "lede",
      title: "Intro paragraph",
      type: "text",
      rows: 3,
      description: "One or two sentences under the heading. Optional.",
    }),
    defineField({
      name: "seoDescription",
      title: "Search-engine description",
      type: "text",
      rows: 2,
      description:
        "What shows under the page title in Google. Around 150 characters.",
      validation: (r) => r.max(200),
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "eyebrow" },
  },
});
