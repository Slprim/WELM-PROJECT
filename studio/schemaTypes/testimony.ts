import { defineField, defineType } from "sanity";

export default defineType({
  name: "testimony",
  title: "Testimony",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: 'Use "Anonymous" if the person did not want to be named.',
      validation: (r) => r.required(),
    }),
    defineField({ name: "body", type: "text", rows: 5, validation: (r) => r.required() }),
    defineField({ name: "order", title: "Sort order", type: "number", initialValue: 100 }),
  ],
  orderings: [{ title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name", subtitle: "body" } },
});
