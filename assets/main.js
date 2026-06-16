'use strict';

/* ── View counter ─────────────────────────────────────────── */

const VIEWS_KEY = 'rbxhub_views';

function slugHash(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (Math.imul(31, h) + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getBaseViews(slug) { return 8000 + (slugHash(slug) % 57000); }

function storedViews() {
  try { return JSON.parse(localStorage.getItem(VIEWS_KEY) || '{}'); } catch { return {}; }
}

function getViews(slug) { return getBaseViews(slug) + (storedViews()[slug] || 0); }

function incrementViews(slug) {
  const d = storedViews();
  d[slug] = (d[slug] || 0) + 1;
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(d)); } catch {}
  return getViews(slug);
}

/* ── Counter animation ───────────────────────────────────── */

function animateCount(el, target, ms) {
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / ms, 1);
    const v = Math.floor((1 - Math.pow(1 - p, 3)) * target);
    el.textContent = v.toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

/* ── Homepage ────────────────────────────────────────────── */

function initHome() {
  /* Animate stat counters (values stored in data-value by generate.py) */
  document.querySelectorAll('.stat-value[data-value]').forEach(el => {
    animateCount(el, parseInt(el.dataset.value, 10), 1200);
  });

  /* Update view counts on pre-rendered cards */
  document.querySelectorAll('.card-views[data-slug]').forEach(el => {
    const num = el.querySelector('.views-num');
    if (num) num.textContent = getViews(el.dataset.slug).toLocaleString();
  });

  /* Search — show/hide pre-rendered cards */
  const searchInput = document.getElementById('searchInput');
  const countEl     = document.getElementById('resultCount');

  function filterCards() {
    const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visible = 0;

    document.querySelectorAll('#cardsGrid .card').forEach(card => {
      const show = !q || (card.dataset.name || '').includes(q);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (countEl) countEl.textContent = `${visible} script${visible !== 1 ? 's' : ''}`;
  }

  if (searchInput) searchInput.addEventListener('input', filterCards);
}

/* ── Script page ─────────────────────────────────────────── */

function initScriptPage() {
  const slug = document.body.dataset.slug;
  if (!slug) return;

  /* Increment + display view count */
  const views  = incrementViews(slug);
  const viewEl = document.getElementById('viewCount');
  if (viewEl) viewEl.textContent = views.toLocaleString();

  /* Copy button — resets after 2 s */
  const copyBtn = document.getElementById('copyBtn');
  const codeEl  = document.getElementById('scriptCode');
  if (copyBtn && codeEl) {
    copyBtn.addEventListener('click', async () => {
      const text = codeEl.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = Object.assign(document.createElement('textarea'), {
          value: text,
          style: 'position:fixed;opacity:0',
        });
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }

      copyBtn.classList.add('copied');
      copyBtn.innerHTML = '&#10003; Copied!';

      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg> Copy Script`;
      }, 2000);
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ── Entry point ─────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'home')   initHome();
  if (page === 'script') initScriptPage();
});
