(() => {
  const seg = document.getElementById('language-switch');
  const fa = document.getElementById('study-fa'), en = document.getElementById('study-en');
  const bar = document.querySelector('.read-progress');
  const T = { fa: 'عبدالله هاشم ابا الصادق | مطالعه', en: 'Abdullah Hashem Aba Al-Sadiq | Study' };
  const tocLinks = [...document.querySelectorAll('.toc-link')];
  let spy = null;

  /* Keep the table of contents pointing at the section set that is currently visible. */
  const observeSections = () => {
    if (spy) spy.disconnect();
    const active = document.querySelector('.study-version:not([hidden])');
    if (!active) return;
    const sections = [...active.querySelectorAll('.article-section[id]')];
    if (!sections.length) return;
    if (!('IntersectionObserver' in window)) return;
    spy = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = '#' + e.target.id;
      tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
    }), { rootMargin: '-22% 0px -68% 0px' });
    sections.forEach(s => spy.observe(s));
  };

  const set = (lang, save) => {
    const isEn = lang === 'en';
    fa.hidden = isEn; en.hidden = !isEn;
    document.documentElement.lang = lang; document.documentElement.dir = isEn ? 'ltr' : 'rtl';
    seg.dataset.active = lang;
    seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    /* Every translatable node in the shared shell (hero, contents, closing CTA). */
    document.querySelectorAll('[data-fa]').forEach(el => {
      const value = el.dataset[lang];
      if (value != null) el.textContent = value;
    });
    /* Contents entries resolve to the ids of the language that is now on screen. */
    tocLinks.forEach(a => {
      const href = a.dataset[lang === 'en' ? 'hrefEn' : 'hrefFa'];
      if (href) a.setAttribute('href', href);
    });
    document.title = T[lang];
    if (save) { try { localStorage.setItem('study-lang', lang); } catch (_) {} scrollTo({ top: 0, behavior: 'smooth' }); }
    tocLinks.forEach(a => a.classList.remove('active'));
    observeSections();
  };

  seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b && b.dataset.lang !== seg.dataset.active) set(b.dataset.lang, true); });
  let start = 'fa';
  try { start = new URLSearchParams(location.search).get('lang') || localStorage.getItem('study-lang') || 'fa'; } catch (_) {}
  if (start === 'en') set('en', false); else observeSections();

  const tick = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();

  const header = document.querySelector('.site-header');
  addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 30), { passive: true });

  /* Floating "back to top" for long reads. */
  const top = document.querySelector('.read-top');
  if (top) {
    const toggle = () => top.classList.toggle('show', scrollY > 700);
    addEventListener('scroll', toggle, { passive: true }); toggle();
    top.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: 'smooth' }); });
  }
})();
