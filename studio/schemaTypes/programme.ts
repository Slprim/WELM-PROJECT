import { defineField, defineType } from "sanity";

/**
 * An upcoming programme — a conference, convention, campaign or special
 * service — shown in the carousel on the home page.
 *
 * Each entry carries its own artwork AND its own words, because the carousel
 * changes both together: when the image moves, the text beside it moves with
 * it.
 */
export default defineType({
  name: "programme",
  title: "Upcoming programme",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: 'e.g. "Prophetic and Power Conference"',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Theme or subtitle",
      type: "string",
      description: 'Optional. e.g. "Theme: Light in Darkness"',
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 4,
      description: "A sentence or two about the programme.",
    }),
    defineField({
      name: "startDate",
      title: "Date",
      type: "date",
      description:
        "Used to order the carousel and to hide the programme once it has passed. Leave empty for something ongoing.",
    }),
    defineField({
      name: "dateLabel",
      title: "Date as it should read",
      type: "string",
      description: 'e.g. "Mon. 6th March, 2023" or "Every Sunday in November"',
    }),
    defineField({ name: "time", type: "string", description: 'e.g. "8am – 2pm"' }),
    defineField({
      name: "venue",
      type: "string",
      description: 'e.g. "Cambridge Centre of Excellence, Dzorwulu"',
    }),
    defineField({
      name: "image",
      title: "Programme artwork",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          description: "Describe the artwork for screen readers.",
          validation: (r) => r.required(),
        }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "link",
      title: "Link",
      type: "url",
      description: "Optional. Registration, livestream or details page.",
    }),
    defineField({
      name: "linkLabel",
      title: "Link button text",
      type: "string",
      initialValue: "Find out more",
    }),
    defineField({
      name: "published",
      title: "Show on the site?",
      type: "boolean",
      initialValue: true,
      description: "Turn off to take a programme down without deleting it.",
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      description: "Lower numbers appear first. Used when there is no date.",
      initialValue: 100,
    }),
  ],
  orderings: [
    { title: "Soonest first", name: "dateAsc", by: [{ field: "startDate", direction: "asc" }] },
    { title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "dateLabel", media: "image" },
  },
});
