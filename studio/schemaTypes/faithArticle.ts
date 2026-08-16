import { defineField, defineType } from "sanity";

/** One article of the statement of faith. */
export default defineType({
  name: "faithArticle",
  title: "Article of faith",
  type: "document",
  fields: [
    defineField({ name: "article", type: "text", rows: 2, validation: (r) => r.required() }),
    defineField({
      name: "refs",
      title: "Scripture references",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "order", title: "Sort order", type: "number", initialValue: 100 }),
  ],
  orderings: [{ title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "article", subtitle: "refs" } },
});
