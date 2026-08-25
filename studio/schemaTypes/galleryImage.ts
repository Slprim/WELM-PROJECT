import { defineField, defineType } from "sanity";

/**
 * One photo in the gallery.
 *
 * A document per photo rather than one array, so staff can add, remove and
 * reorder individual images without opening a single huge record — and so the
 * gallery can grow past a handful without the Studio becoming unwieldy.
 */
export default defineType({
  name: "galleryImage",
  title: "Gallery photo",
  type: "document",
  fields: [
    defineField({
      name: "image",
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
      validation: (r) => r.required(),
    }),
    defineField({
      name: "caption",
      type: "string",
      description: "Optional line shown under the photo.",
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
  preview: { select: { title: "caption", subtitle: "image.alt", media: "image" } },
});
