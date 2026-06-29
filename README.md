# Philosophy Wiki

A personal reference wiki on the history of Western philosophy, published to GitHub Pages:
**https://mchughde.github.io/philosophy-wiki/**

It aims to cover 100 significant philosophers from Ancient Greece & Rome through to the 21st century.

## Viewing the wiki

- **Live site:** the URL above (updates about a minute after publishing).
- **Locally:** double-click **Open Philosophy Wiki.command** — it starts the local server and opens the wiki in your browser. The terminal window flashes briefly, then closes.

The app is a read-only viewer: browse philosophers in the sidebar (grouped by period), search from the top bar, and follow `[[wikilinks]]` between entries. There are no New, Edit, or Export buttons in the app — those tasks are done outside the app with Claude (see below).

## Adding or editing entries

Entries live in `entries.js` (the `ENTRIES` array) and are written with Claude. Ask Claude to "draft an entry for [philosopher]"; it works only from the files in `Source material/[Philosopher]/`, writes the entry in the standard structure, and saves it into `entries.js`.

**Content conventions:**
- Plain prose, with Markdown supported.
- `[[Name]]` links to another entry, e.g. `[[Plato]]`.
- `## Heading` for sections. Entries use three: **Biographical Details**, **Key Ideas**, **Major Works**.

**Photos:**
- Use a direct image URL (from Wikimedia Commons — the URL starts with `upload.wikimedia.org`), **or**
- Save an image into the `photos/` folder and set the entry's photo to just the filename, e.g. `kant.jpg`.

## Publishing

Double-click **Publish Philosophy Wiki.command** — it stages, commits, and pushes all changes to GitHub. The live site updates within about a minute. (Claude can also commit and push for you.)

## Exporting

Exporting is done outside the app with Claude, using `export_entry.py`, which compiles an entry into a 6×9 Word document from its `slug`. Open the result in Word and save as PDF if you need one.

## Files (the deployed site)

| File | Purpose |
|------|---------|
| `index.html` | Page shell |
| `app.js` | Viewer logic — rendering, sidebar, search, wikilinks |
| `entries.js` | All entry content (the `ENTRIES` array) |
| `style.css` | Visual design |
| `db.js` | Offline cache (IndexedDB) for the installable app |
| `sw.js` | Service worker — offline / PWA caching |
| `manifest.json` | PWA manifest |
| `icons/` | App icons |
| `photos/` | Local portrait images |

Supporting files, not part of the page itself: `server.py` (local dev server), `export_entry.py` (DOCX export), `philosophers-100.md` (planning list).

## Content workflow (with Claude)

1. Ask Claude to "draft an entry for [philosopher]."
2. Claude reads only the sources in `Source material/[Philosopher]/`, drafts the entry, runs its copyright and natural-prose checks, and fact-checks every claim against the sources.
3. Claude saves it into `entries.js` and — with your go-ahead — publishes via git.
4. The live site updates about a minute later.
