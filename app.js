// ============================================================
// Philosophy Wiki — App
// ============================================================

import { seedEntries, getEntry, getAllEntries, searchEntries } from './db.js';
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
        <h1 class="entry-title">${entry.title}</h1>
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
        <h1>Philosophy Wiki</h1>
      </div>
      <p class="subtitle"><em>A personal reference on the history of Western philosophy.</em></p>
      <p class="intro">This wiki aims to provide concise entries on 100 significant philosophers from Ancient Greece &amp; Rome through to the 21st century. Coverage of the modern and contemporary periods leans towards the continental tradition — phenomenology, existentialism, critical theory, structuralism and its aftermath — while the earlier periods survey the full breadth of Western thought.</p>
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

  document.querySelectorAll('#entry-list a').forEach(a => a.classList.remove('active'));
  document.title = 'Philosophy Wiki';
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

// ── Event delegation: wikilinks ───────────────────────────────

function initContentEvents() {
  document.getElementById('content').addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href && href.startsWith('#entry:')) {
      e.preventDefault();
      location.hash = href;
    }
  });
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

  window.addEventListener('hashchange', route);
  await route();
  registerSW();
}

boot();
