import type { StructureResolver, StructureBuilder } from "sanity/structure";

/**
 * Studio navigation, organised by PAGE rather than by document type.
 *
 * The default Sanity sidebar lists "Posts", "People", "FAQs" and so on, which
 * tells an editor what kind of record something is but not where it shows up.
 * This structure inverts that: you open the page you want to change, and see
 * the pieces that appear on it — its heading, and each block of cards with the
 * title it carries on the live site.
 *
 * The documents themselves are unchanged. A person edited under "About page"
 * is the same record as under any other route to it.
 */

/** Opens one fixed document directly, with no list in front of it. */
const singleton = (
  S: StructureBuilder,
  id: string,
  type: string,
  title: string,
) => S.listItem().title(title).id(id).child(S.document().schemaType(type).documentId(id));

/** The editable heading block at the top of a page. */
const pageHeader = (S: StructureBuilder, id: string) =>
  singleton(S, `page-${id}`, "page", "Page heading & intro");

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Website")
    .items([
      // ───────────────────────── PAGES ─────────────────────────
      S.listItem()
        .title("Home page")
        .child(
          S.list()
            .title("Home page")
            .items([
              pageHeader(S, "home"),
              S.documentTypeListItem("yearlyTheme")
                .title('Section: "Theme of the year"'),
              S.documentTypeListItem("monthlyTheme")
                .title('Section: "Theme of the month"'),
              S.documentTypeListItem("programme")
                .title('Carousel: "Upcoming programmes"'),
              S.documentTypeListItem("service")
                .title('Cards: "The rhythm of the house"')
                .schemaType("service"),
              S.listItem()
                .title('Cards: featured media')
                .child(
                  S.documentList()
                    .title("Featured media")
                    .filter('_type == "sermon" && featured == true')
                    .apiVersion("2024-10-01"),
                ),
            ]),
        ),

      S.listItem()
        .title("About page")
        .child(
          S.list()
            .title("About page")
            .items([
              pageHeader(S, "about"),
              S.documentTypeListItem("historyEvent")
                .title('Timeline: "The foundation of the ministry"'),
              S.documentTypeListItem("testimony")
                .title('Cards: "What the Lord has done"'),
              S.divider(),
              S.listItem()
                .title("↳ Pastor Faith Joseph (sub-page)")
                .child(
                  S.list()
                    .title("Pastor Faith Joseph")
                    .items([pageHeader(S, "pastor")]),
                ),
              S.listItem()
                .title("↳ Statement of Faith (sub-page)")
                .child(
                  S.list()
                    .title("Statement of Faith")
                    .items([
                      pageHeader(S, "statement-of-faith"),
                      S.documentTypeListItem("faithArticle")
                        .title("The numbered articles"),
                    ]),
                ),
              S.listItem()
                .title("↳ Central Committee (sub-page)")
                .child(
                  S.list()
                    .title("Central Committee")
                    .items([
                      pageHeader(S, "central-committee"),
                      S.documentTypeListItem("person")
                        .title("Cards: committee members"),
                    ]),
                ),
              S.listItem()
                .title("↳ Mission & Vision (sub-page)")
                .child(
                  S.list()
                    .title("Mission & Vision")
                    .items([
                      pageHeader(S, "mission-and-vision"),
                      S.documentTypeListItem("yearlyTheme")
                        .title('Cards: "Yearly themes"'),
                    ]),
                ),
            ]),
        ),

      S.listItem()
        .title("Media Library page")
        .child(
          S.list()
            .title("Media Library page")
            .items([
              pageHeader(S, "sermons"),
              S.listItem()
                .title("Featured item (top of page)")
                .child(
                  S.documentList()
                    .title("Featured item")
                    .filter('_type == "sermon" && featured == true')
                    .apiVersion("2024-10-01"),
                ),
              S.documentTypeListItem("sermon").title("Cards: all media items"),
              S.divider(),
              ...["Yearly Theme", "Conferences", "Monthly Theme", "Teachings"].map(
                (series) =>
                  S.listItem()
                    .title(`  ${series}`)
                    .id(`series-${series}`)
                    .child(
                      S.documentList()
                        .title(series)
                        .filter('_type == "sermon" && series == $series')
                        .params({ series })
                        .apiVersion("2024-10-01"),
                    ),
              ),
            ]),
        ),

      S.listItem()
        .title("Blog page")
        .child(
          S.list()
            .title("Blog page")
            .items([
              pageHeader(S, "blog"),
              S.listItem()
                .title("Lead post (large card at top)")
                .child(
                  S.documentList()
                    .title("Newest post — shown as the lead")
                    .filter('_type == "post"')
                    .defaultOrdering([
                      { field: "publishedAt", direction: "desc" },
                    ])
                    .apiVersion("2024-10-01"),
                ),
              S.documentTypeListItem("post").title("Cards: all blog posts"),
            ]),
        ),

      S.listItem()
        .title("Live page")
        .child(
          S.list()
            .title("Live page")
            .items([
              pageHeader(S, "live"),
              S.listItem()
                .title('List: "On air" — online gatherings')
                .child(
                  S.documentList()
                    .title("Online gatherings")
                    .filter('_type == "service" && where != "In person"')
                    .apiVersion("2024-10-01"),
                ),
            ]),
        ),

      S.listItem()
        .title("FAQ page")
        .child(
          S.list()
            .title("FAQ page")
            .items([
              pageHeader(S, "faq"),
              S.documentTypeListItem("faq").title("The questions"),
            ]),
        ),

      S.listItem()
        .title("Gallery page")
        .child(
          S.list()
            .title("Gallery page")
            .items([
              pageHeader(S, "gallery"),
              S.documentTypeListItem("galleryImage").title("The photos"),
            ]),
        ),

      S.listItem()
        .title("Contact page")
        .child(S.list().title("Contact page").items([pageHeader(S, "contact")])),

      S.listItem()
        .title("Give page")
        .child(S.list().title("Give page").items([pageHeader(S, "give")])),

      S.divider(),

      // ───────────────────── ACROSS EVERY PAGE ─────────────────────
      singleton(
        S,
        "siteSettings",
        "siteSettings",
        "Site settings (address, phones, social)",
      ),
      S.listItem()
        .title("All services & gatherings")
        .child(S.documentTypeList("service").title("All services & gatherings")),
      S.listItem()
        .title("All people")
        .child(S.documentTypeList("person").title("All people")),
    ]);
