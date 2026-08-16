import { defineField, defineType } from "sanity";

/**
 * A teaching, conference or series in the media library.
 *
 * `speaker`, `date` and `url` are all optional on purpose — the imported
 * records genuinely do not have them, and the site omits missing fields
 * rather than showing a placeholder.
 */
export default defineType({
  name: "sermon",
  title: "Media item",
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
      name: "kind",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Video", value: "video" },
          { title: "Audio", value: "audio" },
          { title: "Series", value: "series" },
        ],
        layout: "radio",
      },
      initialValue: "video",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "series",
      type: "string",
      options: {
        list: ["Yearly Theme", "Conferences", "Monthly Theme", "Teachings"],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "speaker",
      type: "reference",
      to: [{ type: "person" }],
      description: "Leave empty if the recording does not name a speaker.",
    }),
    defineField({ name: "date", title: "Date", type: "date" }),
    defineField({
      name: "dateLabel",
      title: "Date label",
      type: "string",
      description:
        'Shown when only a rough date is known, e.g. "August 2023" or "Undated".',
    }),
    defineField({ name: "scripture", type: "string" }),
    defineField({ name: "summary", type: "text", rows: 3 }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          description: "Describe the image for screen readers.",
          validation: (r) => r.required(),
        }),
      ],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "url",
      title: "Watch / listen link",
      type: "url",
      description:
        "YouTube or audio link. Until this is filled in the site shows 'Recording not yet published' instead of a dead play button.",
    }),
    defineField({ name: "featured", title: "Feature at the top?", type: "boolean", initialValue: false }),
  ],
  orderings: [
    { title: "Newest first", name: "dateDesc", by: [{ field: "date", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "series", media: "image" },
  },
});
