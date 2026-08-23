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

**This is already done.** The project exists:

| | |
| --- | --- |
| Project ID | `oqhf83r1` |
| Dataset | `production` (public) |
| Organisation | Words of Eternal Life Ministry |
| Owner | thefathershousepulishing@gmail.com |

On a fresh machine, `.env` will not be there — it is gitignored everywhere, so
that nobody can later drop a secret into it and commit it by accident. Recreate
it with the values above:

```bash
cd studio
npm install
npx sanity login
```

Then create `studio/.env` containing:

```
SANITY_STUDIO_PROJECT_ID="oqhf83r1"
SANITY_STUDIO_DATASET="production"
```

Netlify does not need this file — the same values are set in `netlify.toml`.

### Load the existing content

Everything recovered from the old site — the founding history, the ten
articles of faith, the eight committee members, the seven services, the
testimonies, the yearly themes and the six blog posts — loads in one command
rather than being retyped:

```bash
npm run seed              # create missing documents, leave existing ones alone
npm run seed -- --replace # overwrite existing documents too
```

That writes **44 documents**. It runs through `sanity exec --with-user-token`,
which reuses the credentials from `sanity login` — no API token to create by
hand. Safe to re-run.

**Images are not uploaded by the seed.** The artwork lives in the repo at
`img/Themes/` and `img/Prgrms/`. Upload those through the studio once and
attach them to the media items.

### Load the legacy images

Two one-off scripts pull artwork out of the old site and attach it, so the
Studio is not starting from empty:

```bash
npm run upload:service-images   # 6 Sunday photos -> the home page slideshow
npm run upload:blog-covers      # original cover art -> the 6 blog posts
```

Both skip anything that already has images, so a photo uploaded by hand in the
Studio is never overwritten. Add `-- --replace` to override that.

### Point the website at the CMS

In `web/.env` (and in Netlify's environment variables):

```
SANITY_PROJECT_ID=oqhf83r1
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
