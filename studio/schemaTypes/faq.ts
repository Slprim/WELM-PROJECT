import { defineField, defineType } from "sanity";

export default defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({ name: "question", type: "string", validation: (r) => r.required() }),
    defineField({ name: "answer", type: "text", rows: 5, validation: (r) => r.required() }),
    defineField({ name: "order", title: "Sort order", type: "number", initialValue: 100 }),
    defineField({
      name: "published",
      title: "Show on the site?",
      type: "boolean",
      initialValue: true,
      description:
        "Leave off for questions that still need a real answer from the ministry.",
    }),
  ],
  orderings: [{ title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "question", subtitle: "answer" } },
});
