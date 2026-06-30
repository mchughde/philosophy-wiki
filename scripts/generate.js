'use strict';
/**
 * Philosophy Wiki — docx export
 * Usage: node generate.js <wiki_folder> <output_path>
 */

const path = require('path');
// Always use the locally installed docx package (in scripts/node_modules/)
const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  Header, Footer, AlignmentType, SectionType,
  PageNumber, BorderStyle
} = require(path.join(__dirname, 'node_modules', 'docx'));
const fs = require('fs');

// ── Args ──────────────────────────────────────────────────────────────────────
const WIKI_DIR = process.argv[2];
const OUT_PATH = process.argv[3] || path.join(WIKI_DIR, 'Philosophy_Wiki.docx');

if (!WIKI_DIR) {
  console.error('Usage: node generate.js <wiki_folder> [output_path]');
  process.exit(1);
}

// ── Page geometry (6 × 9 inches) ─────────────────────────────────────────────
const PAGE_W      = 8640;
const PAGE_H      = 12960;
const PAGE_MARGIN = { top: 1260, right: 900, bottom: 1440, left: 1440,
                      header: 720, footer: 720, gutter: 0 };

// Photo size from template (1600200 × 2130552 EMU at 96 dpi)
const IMG_W = Math.round(1600200 / 9525);  // ≈ 168 px
const IMG_H = Math.round(2130552 / 9525);  // ≈ 224 px

// ── Load entries ──────────────────────────────────────────────────────────────
const entriesPath = path.join(WIKI_DIR, 'entries.js');
if (!fs.existsSync(entriesPath)) {
  console.error('entries.js not found in: ' + WIKI_DIR);
  process.exit(1);
}

const src = fs.readFileSync(entriesPath, 'utf8')
  .replace(/const ENTRIES\s*=/, 'global._ENTRIES =')
  .replace(/export default ENTRIES;\s*$/, '');
eval(src);
const ENTRIES = global._ENTRIES;
ENTRIES.sort((a, b) => a.born - b.born);

// ── Photo lookup ──────────────────────────────────────────────────────────────
function loadPhoto(entry) {
  const photosDir = path.join(WIKI_DIR, 'photos');
  const candidates = [path.join(photosDir, entry.slug + '.jpg')];
  if (entry.photo && !entry.photo.startsWith('http')) {
    candidates.push(path.join(photosDir, entry.photo));
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  console.warn('  ⚠ No photo found for ' + entry.title + ' — skipping image');
  return null;
}

// ── Inline text parser ────────────────────────────────────────────────────────
function parseInline(text, sz) {
  sz = sz || 21;
  text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
  return text.split(/(\*[^*]+\*)/).filter(Boolean).map(part => {
    const italic = part.startsWith('*') && part.endsWith('*') && part.length > 2;
    return new TextRun({
      text: italic ? part.slice(1, -1) : part,
      italics: italic,
      font: 'Georgia',
      size: sz,
    });
  });
}

// ── Body → paragraphs ─────────────────────────────────────────────────────────
function buildBody(body) {
  const result = [];
  const lines  = body.split('\n');
  let buf      = [];
  let firstInSection = true;
  let isIntro  = true;
  let inQuotes = false;

  const flush = () => {
    if (!buf.length) return;
    const text = buf.join(' ').trim();
    buf = [];
    if (!text) return;
    const isAttrib = /^\*—/.test(text);
    // Quotes are always flush to the margin — never first-line indented.
    const indent   = (!firstInSection && !isAttrib && !inQuotes) ? { firstLine: 288 } : undefined;
    result.push(new Paragraph({
      children: parseInline(text),
      spacing: { before: 0, after: isIntro ? 200 : 160 },
      indent,
    }));
    firstInSection = false;
    isIntro = false;
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      flush();
      result.push(new Paragraph({
        children: [new TextRun({ text: h2[1].toUpperCase(), bold: true,
                                 font: 'Georgia', size: 15, color: '444444' })],
        spacing: { before: 360, after: 120 },
      }));
      firstInSection = true;
      inQuotes = /^quotes$/i.test(h2[1].trim());
    } else if (!line.trim()) {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return result;
}

// ── Build sections ────────────────────────────────────────────────────────────
const sections = ENTRIES.map(entry => {
  const fmt  = yr => Math.abs(yr) + (yr < 0 ? ' BC' : ' AD');
  const tags = entry.tags.map(t => t.toUpperCase()).join('  ·  ');
  const photo = loadPhoto(entry);

  const children = [
    new Paragraph({
      children: [new TextRun({ text: entry.title, bold: true, font: 'Georgia', size: 52 })],
      spacing: { before: 0, after: 80 },
    }),
    new Paragraph({
      children: [new TextRun({ text: fmt(entry.born) + ' – ' + fmt(entry.died),
                               font: 'Georgia', size: 18, color: '666666' })],
      spacing: { before: 0, after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: tags, font: 'Georgia', size: 16, color: '999999' })],
      spacing: { before: 0, after: 280 },
    }),
    ...(photo ? [new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: 120, after: 200 },
      children: [new ImageRun({
        type: 'jpg', data: photo,
        transformation: { width: IMG_W, height: IMG_H },
        altText: { title: entry.title, description: entry.title, name: entry.title },
      })],
    })] : []),
    ...buildBody(entry.body),
  ];

  return {
    properties: {
      type: SectionType.ODD_PAGE,
      page: { size: { width: PAGE_W, height: PAGE_H }, margin: PAGE_MARGIN },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC', space: 4 } },
          children: [new TextRun({ text: entry.title.toUpperCase(),
                                   font: 'Georgia', size: 15, color: '888888' })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT],
                                   font: 'Georgia', size: 18 })],
        })],
      }),
    },
    children,
  };
});

// ── Write ─────────────────────────────────────────────────────────────────────
const doc = new Document({ sections });
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT_PATH, buf);
  console.log('✓ Generated: ' + OUT_PATH + '  (' + Math.round(buf.length / 1024) + ' KB)');
}).catch(err => { console.error(err); process.exit(1); });
