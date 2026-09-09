import { defineField, defineType } from "sanity";

/** A recurring gathering — Sunday service, Declaration Hour, and so on. */
export default defineType({
  name: "service",
  title: "Service / gathering",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "when",
      title: "When",
      type: "string",
      description: 'Plain words, e.g. "Every Sunday" or "Monday – Saturday".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "time",
      type: "string",
      description: 'e.g. "8:00 – 10:00 am"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "where",
      type: "string",
      options: {
        list: [
          { title: "In person", value: "In person" },
          { title: "Online", value: "Online" },
        ],
        layout: "radio",
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      description:
        'The language this gathering is held in, e.g. "English" or "Twi". Shown as a label on the home page so people can tell two Sunday services apart. Leave blank if it does not need saying.',
      options: {
        list: [
          { title: "English", value: "English" },
          { title: "Twi", value: "Twi" },
          { title: "English & Twi", value: "English & Twi" },
        ],
      },
    }),
    defineField({ name: "note", type: "text", rows: 2, title: "One-line description" }),
    defineField({
      name: "images",
      title: "Card images",
      type: "array",
      description:
        "Photos shown on this service's card on the home page. Add two or more and they scroll automatically. One image just sits still. Drag to reorder.",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              type: "string",
              title: "Alt text",
              description: "Describe the photo for screen readers.",
              validation: (r) => r.required(),
            }),
          ],
        },
      ],
      options: { layout: "grid" },
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first.",
      initialValue: 100,
    }),
  ],
  orderings: [
    { title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "name", subtitle: "time" },
  },
});
