# W.E.L.M — Sanity Studio

The editing interface for the church website. Staff sign in here to post
sermons, events and blog entries without touching code or GitHub.

The website reads from this CMS **if it is configured, and falls back to the
content checked into `web/src/data/` if it is not**. That means the site
builds and deploys fine before any of this is set up — turning the CMS on is
two environment variables, not a rewrite.

---

## One-time setup

Creating the Sanity project requires a Sanity account, so this part cannot be
automated — it needs someone to log in.

```bash
cd studio
npm install

# Log in and create the project. This writes .env with the project ID.
npx sanity login
npx sanity init --env
```

Choose **"Create new project"**, name it `Words of Eternal Life Ministries`,
use the **production** dataset, and decline the sample schema — the schemas in
`schemaTypes/` are already written.

### Load the existing content

Everything recovered from the old site — the founding history, the ten
articles of faith, the eight committee members, the seven services, the
testimonies, the yearly themes and the six blog posts — can be loaded in one
command rather than retyped.

Generate an **Editor** token at [sanity.io/manage](https://sanity.io/manage)
→ your project → API → Tokens, then:

```bash
export SANITY_WRITE_TOKEN=<the token>
npm run seed
```

That writes 44 documents. It is safe to re-run: existing documents are left
alone unless you pass `--replace`.

**Images are not uploaded by the seed.** The artwork lives in the repo at
`img/Themes/` and `img/Prgrms/`. Upload those through the studio once and
attach them to the media items.

### Point the website at the CMS

In `web/.env` (and in Netlify's environment variables):

```
SANITY_PROJECT_ID=<the project id>
SANITY_DATASET=production
```

Rebuild, and the site reads from Sanity.

---

## Running the studio

```bash
npm run dev      # http://localhost:3333
npm run deploy   # publishes to <project>.sanity.studio for staff to use
```

`npm run deploy` is the one that matters — it gives the ministry a hosted URL
they can sign into from a phone.

---

## What's in here

| Document type | What it drives |
| --- | --- |
| **Site settings** | Contact details, address, social links. A singleton — the old site had these copy-pasted into 15 files. |
| **Services & gatherings** | The weekly schedule on the homepage, Live page and FAQ. |
| **Media library** | Sermons, conferences and series. |
| **Blog posts** | The blog index. |
| **People** | Central Committee and pastors. |
| **Testimonies** | The About page. |
| **History timeline** | The About page timeline. |
| **Statement of faith** | The ten articles. |
| **Yearly themes** | Mission & Vision. |
| **FAQs** | The FAQ page. Unpublished entries are the questions still awaiting a real answer. |

### Notes for editors

- **Alt text is required on media images.** It is what screen readers announce,
  and it is what shows if an image fails to load.
- **Leave fields blank rather than guessing.** The site omits missing speakers,
  dates and links instead of showing a placeholder — that is deliberate.
- A media item with no **watch/listen link** shows "Recording not yet
  published" rather than a play button that goes nowhere.
- **People with no photo** show their initials, so adding someone before you
  have a portrait still looks intentional.
