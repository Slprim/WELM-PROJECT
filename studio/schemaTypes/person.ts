import { defineField, defineType } from "sanity";

/** Leadership — the Central Committee and pastors. */
export default defineType({
  name: "person",
  title: "Person",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "role",
      type: "string",
      description: 'e.g. "Head of Evangelism". The old site left several of these as "Designation".',
    }),
    defineField({
      name: "onCommittee",
      title: "On the Central Committee?",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "Sort order",
      type: "number",
      initialValue: 100,
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
      description: "Until a photo is added the site shows the person's initials.",
      fields: [
        defineField({ name: "alt", type: "string", title: "Alt text" }),
      ],
    }),
    defineField({ name: "bio", type: "array", of: [{ type: "block" }] }),
  ],
  orderings: [
    { title: "Sort order", name: "order", by: [{ field: "order", direction: "asc" }] },
  ],
  preview: { select: { title: "name", subtitle: "role", media: "photo" } },
});
