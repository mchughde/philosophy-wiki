# Philosophy Wiki

A personal reference wiki on the history of Western philosophy.

## Starting the wiki

Double-click **Open Philosophy Wiki.command** in this folder. It starts the local server and opens the wiki in your browser. Terminal will flash briefly then close.

## Adding or editing entries

Use the **+ New entry** button on the home page, or the **Edit** button on any entry page. Fill in the fields and hit Save. Everything is backed up to `entries.js` automatically.

**Content field tips:**
- Write in plain prose — Markdown formatting is supported
- Use `[[Name]]` to link to another entry, e.g. `[[Plato]]`
- Use `## Heading` for section headings

**Photos:**
- Paste a direct image URL (from Wikimedia Commons: click the image, copy the URL from the address bar — it starts with `upload.wikimedia.org`)
- Or save an image file into the `photos/` folder and type just the filename, e.g. `kant.jpg`

## Exporting to PDF

Click **Export PDF** in the top bar. All entries will be compiled into a single document in chronological order. In the print dialog, choose **Save as PDF**.

## Files

| File | Purpose |
|------|---------|
| `entries.js` | All entry content — auto-updated on every save |
| `app.js` | App logic |
| `db.js` | Local database |
| `style.css` | Visual design |
| `server.py` | Local server (handles auto-save) |
| `photos/` | Local image files |

## Content workflow (with Claude)

1. Say "draft an entry for [philosopher]" in Cowork
2. Claude researches and writes the markdown
3. Review and approve the content
4. Open the wiki, click **+ New entry**, paste the content, save
