/* AROPL content renderer — fills index.html sections from window.AROPL_CONTENT.
   The TikTok roster (tiktok-accounts.js) is regenerated at build time from the
   same content, so both stay in sync automatically. */
(() => {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const fill = (tpl, d) => tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => d[k] != null ? esc(d[k]) : '');
  const get = id => document.getElementById(id).textContent.trim();
  const C = (() => {
    const el = document.getElementById('aropl-content');
    try { return el ? JSON.parse(el.textContent) : {}; } catch (_) { return {}; }
  })();
  const host = document.createDocumentFragment();

  /* Books */
  if (Array.isArray(C.books) && C.books.length) {
    const stack = document.querySelector('.books-stack');
    const tpl = get('aropl-tpl-books');
    stack.querySelectorAll('article').forEach(a => a.remove());
    C.books.forEach(b => { const t = document.createElement('template'); t.innerHTML = fill(tpl, b).replace('class="book-card book-card--', 'class="book-card book-card--' + (b.variant || '')); stack.appendChild(t.content); });
    const featured = stack.querySelector('.book-card--' + (C.books[0].variant || '')); // no-op keep classes
  }

  /* YouTube blocks: channel card + videos */
  const tplV = get('aropl-tpl-video'), tplC = get('aropl-tpl-channel');
  document.querySelectorAll('.youtube-block').forEach(block => {
    const data = (C.youtubeBlocks || []).find(b => b.label === block.getAttribute('aria-labelledby'));
    if (!data) return;
    const sc = block.querySelector('.youtube-scroller');
    sc.querySelectorAll('article').forEach(a => a.remove());
    const ct = document.createElement('template'); ct.innerHTML = fill(tplC, data); sc.appendChild(ct.content);
    (data.videos || []).forEach(v => { const t = document.createElement('template'); t.innerHTML = fill(tplV, v); sc.appendChild(t.content); });
  });

  /* TikTok LIVE cards (metadata only; status comes from the backend) */
  if (Array.isArray(C.tiktokAccounts) && C.tiktokAccounts.length) {
    const grid = document.querySelector('.live-grid');
    const tplL = get('aropl-tpl-livecard');
    grid.querySelectorAll('a.live-card').forEach(a => a.remove());
    C.tiktokAccounts.forEach(a => {
      const card = { ...a };
      let html = fill(tplL, card);
      if (a.official) {
        html = html.replace('class="live-card reveal"', 'class="live-card live-card--featured reveal" data-featured="1"');
        html = html.replace('<span class="live-body">', '<span class="live-body">\n            <span class="live-role"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.6 6.1 6.6.5-5 4.3 1.5 6.5L12 16.6 6.3 20l1.5-6.5-5-4.3 6.6-.5L12 2.6Z"/></svg>کانال رسمی فارسی</span>');
        html = html.replace('width="58" height="58"', 'width="128" height="128"');
      }
      const t = document.createElement('template'); t.innerHTML = html; grid.appendChild(t.content);
    });
  }
})();
