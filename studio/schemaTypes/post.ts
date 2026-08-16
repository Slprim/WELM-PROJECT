import { defineField, defineType } from "sanity";

/**
 * Blog post. The imported posts have no date or author because the legacy
 * site published none — both fields are optional so nothing has to be
 * invented to save a record.
 */
export default defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 4,
      description: "Shown on the blog index.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "scripture", type: "string" }),
    defineField({ name: "publishedAt", title: "Published", type: "datetime" }),
    defineField({ name: "author", type: "reference", to: [{ type: "person" }] }),
    defineField({
      name: "body",
      title: "Full post",
      type: "array",
      of: [{ type: "block" }],
      description:
        "The imported posts have only the short excerpt — the old 'Read More' links went nowhere. Add the full text here and the post gets its own page.",
    }),
    defineField({ name: "coverImage", type: "image", options: { hotspot: true } }),
  ],
  orderings: [
    { title: "Newest first", name: "pubDesc", by: [{ field: "publishedAt", direction: "desc" }] },
  ],
  preview: { select: { title: "title", subtitle: "scripture", media: "coverImage" } },
});
