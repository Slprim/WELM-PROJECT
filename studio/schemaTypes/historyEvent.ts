import { defineField, defineType } from "sanity";

/** One entry on the About page timeline. */
export default defineType({
  name: "historyEvent",
  title: "History milestone",
  type: "document",
  fields: [
    defineField({
      name: "dateLabel",
      title: "Date",
      type: "string",
      description: 'As it should read, e.g. "5 August 2012" or "2012 – 2013".',
      validation: (r) => r.required(),
    }),
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "body", type: "text", rows: 5, validation: (r) => r.required() }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first, so the timeline reads oldest to newest.",
      initialValue: 100,
    }),
  ],
  orderings: [{ title: "Timeline order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "dateLabel" } },
});
