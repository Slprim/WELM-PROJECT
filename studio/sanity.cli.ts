import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  },

  /**
   * The deployed Studio's hostname — welm.sanity.studio.
   *
   * Pinned here so `sanity deploy` never stops to ask, which matters because
   * it otherwise cannot run unattended, and because picking "Create new studio
   * hostname" by mistake would strand staff on a second, empty-looking Studio.
   */
  studioHost: "welm",
});
