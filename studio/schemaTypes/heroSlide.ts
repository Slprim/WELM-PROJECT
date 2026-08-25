import { defineField, defineType } from "sanity";

/**
 * One slide in the big carousel at the top of the home page.
 *
 * Each slide carries its own background AND its own words, because the
 * carousel changes both together. A slide can use either a photo or a video
 * as its background.
 */
export default defineType({
  name: "heroSlide",
  title: "Home page hero slide",
  type: "document",
  fields: [
    defineField({
      name: "mediaType",
      title: "Background",
      type: "string",
      options: {
        list: [
          { title: "Photo", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
      },
      initialValue: "image",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Background photo",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "image",
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
          description: "Describe the photo for screen readers.",
        }),
      ],
    }),
    defineField({
      name: "video",
      title: "Background video",
      type: "file",
      options: { accept: "video/mp4" },
      description:
        "MP4, muted and short — it loops silently behind the text. Keep it under about 3MB so the page stays fast on mobile data.",
      hidden: ({ parent }) => parent?.mediaType !== "video",
    }),
    defineField({
      name: "eyebrow",
      title: "Small label",
      type: "string",
      description: 'The short gold line above the headline, e.g. "Welcome to".',
    }),
    defineField({
      name: "title",
      title: "Headline",
      type: "string",
      description: 'The plain part of the headline, e.g. "Kingdom".',
      validation: (r) => r.required(),
    }),
    defineField({
      name: "accent",
      title: "Headline — highlighted words",
      type: "string",
      description:
        'Shown in gold italic after the headline, e.g. "of Gods". Optional.',
    }),
    defineField({
      name: "body",
      title: "Sentence underneath",
      type: "text",
      rows: 3,
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
    select: { title: "title", subtitle: "eyebrow", media: "image" },
  },
});
