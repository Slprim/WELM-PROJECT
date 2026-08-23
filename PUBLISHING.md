# Why publishing in Sanity doesn't change the site by itself

This is the single most surprising thing about how the site works, so it is
worth being blunt about it.

**The website is static.** Every page is built into finished HTML ahead of
time, which is why it loads fast, costs nothing to host and cannot be taken
down by a database outage. The content is read from Sanity **once, during the
build** — not when a visitor opens the page.

So pressing **Publish** in Sanity Studio updates the CMS, but the live site
keeps serving the HTML that was built earlier. Nothing is broken; the site
just has not been rebuilt yet.

There are three ways to see a change, depending on what you are doing.

---

## 1. While editing — see changes instantly

```bash
cd web
npm run dev
```

The dev server re-reads Sanity on every page load, so publish in Studio,
refresh the browser, and the change is there. **This is the right way to work
while you are writing content.**

## 2. Checking the real production build locally

```bash
cd web
npm run build && npm run preview
```

`npm run preview` serves the last build. If you leave it running and publish
something new, **you will not see it** — you have to run `npm run build`
again. That is almost certainly what happened when the cover image did not
appear.

## 3. On the live site — make it automatic

Once the repo is connected to Netlify, publishing in Sanity should rebuild and
redeploy on its own. Two steps, one time:

**a. Get a build hook from Netlify**

Site configuration → Build & deploy → Build hooks → *Add build hook*. Name it
`Sanity publish`, branch `main`. Netlify gives you a URL like:

```
https://api.netlify.com/build_hooks/abc123def456
```

**b. Point Sanity at it**

```bash
cd studio
npx sanity hook create \
  --name "Rebuild site on publish" \
  --url "https://api.netlify.com/build_hooks/abc123def456" \
  --dataset production \
  --trigger create --trigger update --trigger delete
```

From then on: publish in Studio → Netlify rebuilds → the change is live in a
minute or two.

Check it is working with `npx sanity hook list` and `npx sanity hook logs`.

---

## Images specifically

Images live on Sanity's own CDN, not in the repo, so an uploaded image is
available the moment you publish. It still needs a rebuild to appear, exactly
like text.

Two things to know when uploading:

- **Alt text is required** on media images. It is what a screen reader
  announces and what shows if the image fails to load.
- **Crop matters.** Blog covers render wide (16:10), committee portraits
  render tall (3:4). Use the hotspot tool in Sanity to set the focal point so
  faces are not cropped out.

---

## Quick reference

| Situation | What to do |
| --- | --- |
| Writing content, want to see it now | `npm run dev` in `web/`, refresh |
| Checking the real build | `npm run build` then `npm run preview` |
| Published, live site unchanged | It needs a rebuild — set up the webhook above |
| Image uploaded but not showing | Same: rebuild. Check alt text is filled in. |
| Changed something, want it undone | Sanity keeps document history — open the doc and use the revision list |
