import { defineField, defineType } from "sanity";

/** The word over the house for a given year. */
export default defineType({
  name: "yearlyTheme",
  title: "Yearly theme",
  type: "document",
  fields: [
    defineField({ name: "year", type: "number", validation: (r) => r.required().min(2000).max(2100) }),
    defineField({ name: "title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "subtitle", type: "string" }),
    defineField({ name: "scripture", type: "string" }),
    defineField({ name: "artwork", type: "image", options: { hotspot: true } }),
  ],
  orderings: [
    { title: "Newest first", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  preview: { select: { title: "title", subtitle: "year", media: "artwork" } },
});
