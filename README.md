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
- `## Heading` for sections. Entries use four: **Biographical Details**, **Key Ideas**, **Major Works**, **Quotes**. Quotes are supplied by you and added separately — Claude does not generate them independently.

**Photos:**
Save a JPEG into the `photos/` folder named after the philosopher's slug, e.g. `kant.jpg` for slug `kant`. The export script looks for this file automatically. If no photo is found the entry is still exported — just without an image.

## Publishing

When you add an entry using the philosopher-entry skill, Claude commits and pushes to GitHub automatically — you don't need to do anything extra.

For manual changes (direct edits to `entries.js`, new photos, etc.), double-click **Publish Philosophy Wiki.command** to stage, commit, and push. Alternatively, ask Claude to commit and push for you. The live site updates within about a minute.

## Exporting

Double-click **export.command** in Finder to generate `Philosophy_Wiki.docx` — a 6×9 formatted book containing all entries, with per-philosopher running headers, portrait photos, and mirror margins. The file is written to this folder and is not committed to git.

Alternatively, ask Claude to "export the wiki" and it will run the same scripts and hand you the file directly.

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

Supporting files, not part of the page itself: `server.py` (local dev server), `export.command` / `export.sh` (DOCX export launchers), `scripts/` (export scripts and dependencies), `philosophers-100.md` (planning list).

## Content workflow (with Claude)

1. Ask Claude to "draft an entry for [philosopher]."
2. Claude reads only the sources in `Source material/[Philosopher]/`, drafts the entry, runs its copyright and natural-prose checks, and fact-checks every claim against the sources.
3. Claude saves it into `entries.js` and — with your go-ahead — publishes via git.
4. The live site updates about a minute later.
5. Add a portrait JPEG to `photos/` named after the philosopher's slug.
6. When you want a fresh Word export, double-click **export.command** (or ask Claude to "export the wiki").
