import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemaTypes";
import { structure } from "./structure";

/**
 * Sanity Studio for Words of Eternal Life Ministries.
 *
 * `projectId` comes from the environment so this file can be committed
 * without pinning anyone's project. Run `npx sanity init --env` once to
 * create the project and write .env — see studio/README.md.
 */
const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? "";
const dataset = process.env.SANITY_STUDIO_DATASET ?? "production";

/** Documents there should only ever be one of. */
const SINGLETONS = new Set(["siteSettings", "page"]);

export default defineConfig({
  name: "welm",
  title: "Words of Eternal Life Ministries",
  projectId,
  dataset,

  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
    // Hide singletons from the "create new" menu so staff can't end up with
    // three competing copies of the site settings.
    templates: (prev) => prev.filter((t) => !SINGLETONS.has(t.schemaType)),
  },

  document: {
    actions: (input, context) =>
      SINGLETONS.has(context.schemaType)
        ? input.filter(
            ({ action }) =>
              action && !["unpublish", "delete", "duplicate"].includes(action),
          )
        : input,
  },
});
