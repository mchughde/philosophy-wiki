// ============================================================
// Philosophy Wiki — App
// ============================================================

import { seedEntries, getEntry, getAllEntries, searchEntries, putEntry } from './db.js';
import ENTRIES from './entries.js';

// ── Period definitions ────────────────────────────────────────

const PERIODS = [
  'Ancient Greece & Rome',
  'Medieval',
  'Early Modern',
  '18th Century',
  '19th Century',
  'Early 20th Century',
  'Mid–Late 20th Century',
  'Late 20th / 21st Century',
];

// ── Wikilink parsing ─────────────────────────────────────────

function parseWikilinks(markdown) {
  return markdown.replace(/\[\[([^\]]+)\]\]/g, (_, label) => {
    const slug = label.trim().toLowerCase().replace(/\s+/g, '-');
    return `[${label.trim()}](#entry:${slug})`;
  });
}

// ── Helpers ───────────────────────────────────────────────────

function formatYear(n) {
  if (n == null) return '?';
  return n < 0 ? `${Math.abs(n)} BC` : `${n} AD`;
}

function slugify(title) {
  return title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Parse a year string like "469 BC", "-469", "1724 AD", "1724" into a number
function parseYear(str) {
  if (!str || !str.toString().trim()) return null;
  const s = str.toString().trim();
  const bcMatch = s.match(/^(\d+)\s*BC$/i);
  if (bcMatch) return -parseInt(bcMatch[1]);
  const adMatch = s.match(/^(\d+)\s*(?:AD)?$/i);
  if (adMatch) return parseInt(adMatch[1]);
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

function bumpVersion(v) {
  if (!v) return '1.0';
  const parts = v.split('.');
  parts[parts.length - 1] = String(parseInt(parts[parts.length - 1]) + 1);
  return parts.join('.');
}

// ── Render: entry ─────────────────────────────────────────────

function renderEntry(entry) {
  const content = document.getElementById('content');

  const processedBody = parseWikilinks(entry.body);
  const htmlBody = marked.parse(processedBody);

  const tagsHtml = (entry.tags || [])
    .map(t => `<span class="tag">${t}</span>`)
    .join('');

  const photoSrc = entry.photo
    ? (entry.photo.startsWith('http') ? entry.photo : `./photos/${entry.photo}`)
    : null;

  const photoHtml = photoSrc
    ? `<figure class="entry-photo">
         <img src="${photoSrc}" alt="${entry.title}" />
       </figure>`
    : '';

  content.innerHTML = `
    <article>
      ${photoHtml}
      <header class="entry-header">
        <div class="entry-header-top">
          <h1 class="entry-title">${entry.title}</h1>
          <div class="entry-header-actions">
            <button class="btn-edit" data-slug="${entry.slug}">Edit</button>
            <button class="btn-export-entry" data-slug="${entry.slug}">Export DOCX</button>
          </div>
        </div>
        <div class="entry-meta">
          <span class="entry-dates">${formatYear(entry.born)} – ${formatYear(entry.died)}</span>
          <span class="entry-tags">${tagsHtml}</span>
        </div>
      </header>
      <div class="entry-body">${htmlBody}</div>
    </article>
  `;

  // Update active link and ensure its group is open
  document.querySelectorAll('#entry-list a').forEach(a => {
    const isActive = a.dataset.slug === entry.slug;
    a.classList.toggle('active', isActive);
    if (isActive) {
      const group = a.closest('details.sidebar-group');
      if (group) group.open = true;
    }
  });

  document.title = `${entry.title} — Philosophy Wiki`;
}

// ── Render: index ─────────────────────────────────────────────

async function renderIndex() {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div id="index-page">
      <div class="index-header">
        <div>
          <h1>Philosophy Wiki</h1>
          <p class="subtitle">A personal reference on the history of Western philosophy.</p>
          <p class="intro">This wiki aims to provide concise entries on 100 significant philosophers from across eight periods: Ancient Greece &amp; Rome; Medieval; Early Modern (16th–17th century); the 18th century; the 19th century; the Early 20th century; and the Mid-to-Late and Late 20th and 21st centuries. Coverage of the modern and contemporary periods leans towards the continental tradition — phenomenology, existentialism, critical theory, structuralism and its aftermath — while the earlier periods survey the full breadth of Western thought.</p>
        </div>
        <button class="btn-new" id="btn-new-entry">+ New entry</button>
      </div>
      <div class="cover-triptych">
        <div class="cover-image">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/1280px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg"
            alt="The School of Athens by Raphael" />
          <span class="cover-caption">Raphael, <em>The School of Athens</em>, 1509–11</span>
        </div>
        <div class="cover-image">
          <img src="https://upload.wikimedia.org/wikipedia/commons/9/92/Rodin_TheThinker.jpg"
            alt="The Thinker by Rodin" />
          <span class="cover-caption">Rodin, <em>The Thinker</em>, 1902</span>
        </div>
        <div class="cover-image">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Rembrandt_-_Aristotle_with_a_Bust_of_Homer_-_Google_Art_Project.jpg"
            alt="Aristotle with a Bust of Homer by Rembrandt" />
          <span class="cover-caption">Rembrandt, <em>Aristotle with a Bust of Homer</em>, 1653</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-new-entry').addEventListener('click', () => {
    location.hash = '#new';
  });

  document.querySelectorAll('#entry-list a').forEach(a => a.classList.remove('active'));
  document.title = 'Philosophy Wiki';
}

// ── Render: editor ────────────────────────────────────────────

async function renderEditor(slug) {
  const content = document.getElementById('content');
  const isNew = !slug;
  const entry = slug ? await getEntry(slug) : null;

  const yearHint = 'e.g. 469 BC or 1724';
  const bornVal  = entry && entry.born != null
    ? (entry.born < 0 ? Math.abs(entry.born) + ' BC' : entry.born + ' AD') : '';
  const diedVal  = entry && entry.died != null
    ? (entry.died < 0 ? Math.abs(entry.died) + ' BC' : entry.died + ' AD') : '';

  content.innerHTML = `
    <div class="editor-wrap">
      <h2 class="editor-heading">${isNew ? 'New entry' : `Editing: ${entry ? entry.title : slug}`}</h2>

      <div class="field-row">
        <div class="field">
          <label for="ed-title">Name</label>
          <input id="ed-title" type="text" placeholder="e.g. Immanuel Kant"
            value="${entry ? entry.title : ''}" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="ed-born">Born</label>
          <input id="ed-born" type="text" placeholder="${yearHint}" value="${bornVal}" />
        </div>
        <div class="field">
          <label for="ed-died">Died</label>
          <input id="ed-died" type="text" placeholder="${yearHint}" value="${diedVal}" />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="ed-tags">Tags <span class="field-hint">(comma-separated)</span></label>
          <input id="ed-tags" type="text" placeholder="e.g. ancient, ethics, athens"
            value="${entry ? (entry.tags || []).join(', ') : ''}" />
        </div>
        <div class="field">
          <label for="ed-period">Period</label>
          <select id="ed-period">
            <option value="">— select —</option>
            ${PERIODS.map(p => `<option value="${p}" ${entry && entry.period === p ? 'selected' : ''}>${p}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="ed-photo">Photo <span class="field-hint">(paste a URL, or a filename from your photos/ folder)</span></label>
          <input id="ed-photo" type="text" placeholder="https://… or socrates.jpg"
            value="${entry ? (entry.photo || '') : ''}" />
        </div>
      </div>

      <div class="field">
        <div class="field-label-row">
          <label for="ed-body">Content <span class="field-hint">(Markdown — use [[Name]] to link to other entries)</span></label>
          <button class="btn-preview" id="ed-preview">Preview</button>
        </div>
        <textarea id="ed-body" rows="20" placeholder="Write the entry here…">${entry ? entry.body : ''}</textarea>
        <div id="ed-preview-pane" class="preview-pane" style="display:none"></div>
      </div>

      <div class="editor-actions">
        <button class="btn-save" id="ed-save">Save</button>
        <button class="btn-cancel" id="ed-cancel">Cancel</button>
      </div>

      <div id="ed-error" class="editor-error" style="display:none"></div>
    </div>
  `;

  // Preview toggle
  let previewing = false;
  document.getElementById('ed-preview').addEventListener('click', () => {
    const textarea = document.getElementById('ed-body');
    const pane     = document.getElementById('ed-preview-pane');
    const btn      = document.getElementById('ed-preview');
    previewing = !previewing;
    if (previewing) {
      pane.innerHTML = marked.parse(parseWikilinks(textarea.value));
      pane.style.display = 'block';
      textarea.style.display = 'none';
      btn.textContent = 'Edit';
    } else {
      pane.style.display = 'none';
      textarea.style.display = 'block';
      btn.textContent = 'Preview';
    }
  });

  document.getElementById('ed-cancel').addEventListener('click', () => {
    history.back();
  });

  document.getElementById('ed-save').addEventListener('click', async () => {
    const title = document.getElementById('ed-title').value.trim();
    const body  = document.getElementById('ed-body').value.trim();
    const errEl = document.getElementById('ed-error');

    if (!title) { showError(errEl, 'Please enter a name.'); return; }
    if (!body)  { showError(errEl, 'Please add some content.'); return; }

    const born   = parseYear(document.getElementById('ed-born').value);
    const died   = parseYear(document.getElementById('ed-died').value);
    const tags   = document.getElementById('ed-tags').value
      .split(',').map(t => t.trim()).filter(Boolean);
    const photo  = document.getElementById('ed-photo').value.trim() || null;
    const period = document.getElementById('ed-period').value || null;

    const finalSlug = entry ? entry.slug : slugify(title);
    if (!finalSlug) { showError(errEl, 'Could not generate a URL slug from that name.'); return; }

    const saved = {
      slug: finalSlug,
      title,
      born,
      died,
      tags,
      period,
      photo,
      body,
      version: bumpVersion(entry ? entry.version : null),
    };

    await putEntry(saved);
    await syncEntriesToDisk();
    await buildSidebar();
    location.hash = `#entry:${finalSlug}`;
  });

  document.querySelectorAll('#entry-list a').forEach(a => a.classList.remove('active'));
  document.title = isNew ? 'New entry — Philosophy Wiki' : `Edit ${entry ? entry.title : ''} — Philosophy Wiki`;
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

// ── Auto-sync entries.js via local server ─────────────────────
// Silently posts all entries to server.py after every save.
// No-ops gracefully if the server isn't running.

async function syncEntriesToDisk() {
  try {
    const all = await getAllEntries();
    await fetch('/save-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all),
    });
  } catch {
    // Server unavailable — not a problem, IndexedDB still has the data
  }
}

// ── Sidebar ───────────────────────────────────────────────────

async function buildSidebar() {
  const entries = await getAllEntries();
  const list = document.getElementById('entry-list');

  // Group by period, preserving PERIODS order; ungrouped entries go last
  const grouped = {};
  PERIODS.forEach(p => { grouped[p] = []; });
  grouped['Other'] = [];

  entries
    .sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999))
    .forEach(e => {
      const p = e.period && grouped[e.period] ? e.period : 'Other';
      grouped[p].push(e);
    });

  // Determine which period contains the active entry
  const activeSlug = location.hash.startsWith('#entry:')
    ? location.hash.slice(7) : null;

  const allPeriods = [...PERIODS, 'Other'];

  list.innerHTML = allPeriods
    .filter(p => grouped[p] && grouped[p].length > 0)
    .map(p => {
      const hasActive = grouped[p].some(e => e.slug === activeSlug);
      const items = grouped[p].map(e => `
        <li>
          <a href="#entry:${e.slug}" data-slug="${e.slug}"
            class="${e.slug === activeSlug ? 'active' : ''}">${e.title}</a>
        </li>
      `).join('');
      return `
        <details class="sidebar-group" ${hasActive ? 'open' : ''}>
          <summary class="sidebar-group-header">${p}</summary>
          <ul class="sidebar-group-list">${items}</ul>
        </details>
      `;
    }).join('');
}

// ── Router ────────────────────────────────────────────────────

async function route() {
  const hash = location.hash;

  if (hash.startsWith('#entry:')) {
    const slug = hash.slice(7);
    const entry = await getEntry(slug);
    if (entry) {
      renderEntry(entry);
    } else {
      document.getElementById('content').innerHTML =
        `<p class="state-msg">Entry "<strong>${slug}</strong>" not found.</p>`;
    }
  } else if (hash === '#new') {
    renderEditor(null);
  } else if (hash.startsWith('#edit:')) {
    const slug = hash.slice(6);
    renderEditor(slug);
  } else {
    renderIndex();
  }

  window.scrollTo(0, 0);
}

// ── Search ────────────────────────────────────────────────────

let searchTimeout = null;

function initSearch() {
  const input = document.getElementById('search');
  const results = document.getElementById('search-results');

  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();

    if (!q) {
      results.innerHTML = '';
      results.classList.remove('visible');
      return;
    }

    searchTimeout = setTimeout(async () => {
      const hits = await searchEntries(q);
      if (!hits.length) {
        results.innerHTML = '<div class="search-result"><span class="search-result-title">No results</span></div>';
      } else {
        results.innerHTML = hits.slice(0, 8).map(e => {
          const idx = e.body.toLowerCase().indexOf(q.toLowerCase());
          let excerpt = '';
          if (idx !== -1) {
            const start = Math.max(0, idx - 30);
            excerpt = (start > 0 ? '…' : '') +
              e.body.slice(start, idx + q.length + 60).replace(/\n/g, ' ') + '…';
          }
          return `
            <div class="search-result" data-slug="${e.slug}">
              <div class="search-result-title">${e.title}</div>
              ${excerpt ? `<div class="search-result-excerpt">${excerpt}</div>` : ''}
            </div>
          `;
        }).join('');
      }
      results.classList.add('visible');
    }, 180);
  });

  results.addEventListener('click', e => {
    const item = e.target.closest('[data-slug]');
    if (!item) return;
    location.hash = `#entry:${item.dataset.slug}`;
    input.value = '';
    results.innerHTML = '';
    results.classList.remove('visible');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove('visible');
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      results.classList.remove('visible');
    }
  });
}

// ── Event delegation: Edit button & wikilinks ─────────────────

function initContentEvents() {
  document.getElementById('content').addEventListener('click', async e => {
    // Edit button
    const editBtn = e.target.closest('.btn-edit');
    if (editBtn) {
      location.hash = `#edit:${editBtn.dataset.slug}`;
      return;
    }
    // Export button
    const exportBtn = e.target.closest('.btn-export-entry');
    if (exportBtn) {
      const entry = await getEntry(exportBtn.dataset.slug);
      if (entry) exportEntryDOCX(entry);
      return;
    }
    // Wikilinks
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && href.startsWith('#entry:')) {
      e.preventDefault();
      location.hash = href;
    }
  });
}

// ── DOCX Export ──────────────────────────────────────────────

async function exportAllDOCX() {
  const btn = document.getElementById('btn-export-all');
  const original = btn ? btn.textContent : null;
  if (btn) btn.textContent = 'Exporting…';
  try {
    const resp = await fetch('/export-all-docx', { method: 'POST' });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      alert('Export failed: ' + (err.error || resp.statusText));
      return;
    }
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'philosophy-wiki.docx';
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    if (btn && original) btn.textContent = original;
  }
}

async function exportEntryDOCX(entry) {
  const btn = document.querySelector(`.btn-export-entry[data-slug="${entry.slug}"]`);
  const original = btn ? btn.textContent : null;
  if (btn) btn.textContent = 'Exporting…';

  try {
    const resp = await fetch('/export-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: entry.slug })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: resp.statusText }));
      alert('Export failed: ' + (err.error || resp.statusText));
      return;
    }
    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${entry.slug}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  } finally {
    if (btn && original) btn.textContent = original;
  }
}

// ── PDF Export ───────────────────────────────────────────────

// Convert an image URL to a base64 data URL so it renders reliably in print.
// Falls back to the original URL if conversion fails (e.g. strict CORS).
async function photoToDataUrl(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        resolve(src); // canvas tainted — use original URL as fallback
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

async function exportEntryPDF(entry) {
  // Convert photo to data URL for reliable print rendering
  let photoHtml = '';
  if (entry.photo) {
    const src = entry.photo.startsWith('http') ? entry.photo : `./photos/${entry.photo}`;
    const dataUrl = await photoToDataUrl(src);
    photoHtml = `<figure class="print-photo"><img src="${dataUrl}" alt="${entry.title}" /></figure>`;
  }

  const body = marked.parse(parseWikilinks(entry.body));
  const tags = (entry.tags || []).join(' · ');

  const entryHtml = `
    <article class="print-entry">
      ${photoHtml}
      <header class="print-header">
        <h1 class="print-title">${entry.title}</h1>
        <p class="print-dates">${formatYear(entry.born)} – ${formatYear(entry.died)}</p>
        <p class="print-tags">${tags}</p>
      </header>
      <div class="print-body">${body}</div>
    </article>
  `;

  let container = document.getElementById('pdf-print-container');
  if (container) container.remove();

  container = document.createElement('div');
  container.id = 'pdf-print-container';
  container.innerHTML = entryHtml;
  document.body.appendChild(container);

  const savedTitle = document.title;
  const savedUrl   = location.href;
  document.title   = entry.title;
  history.replaceState(null, '', location.origin + (location.pathname || '/'));

  window.addEventListener('afterprint', () => {
    document.title = savedTitle;
    history.replaceState(null, '', savedUrl);
    container.remove();
  }, { once: true });

  await new Promise(resolve => setTimeout(resolve, 200));
  window.print();
}

// ── Site title → home ─────────────────────────────────────────

function initHomeLink() {
  document.getElementById('site-title').addEventListener('click', () => {
    location.hash = '';
    renderIndex();
  });
}

// ── Service worker ────────────────────────────────────────────

function registerSW() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }
}

// ── Boot ──────────────────────────────────────────────────────

async function boot() {
  try {
    await seedEntries(ENTRIES);
  } catch (err) {
    console.error('Seeding failed:', err);
  }

  await buildSidebar();
  initSearch();
  initHomeLink();
  initContentEvents();
  document.getElementById('btn-export-all').addEventListener('click', exportAllDOCX);

  window.addEventListener('hashchange', route);
  await route();
  registerSW();
}

boot();
