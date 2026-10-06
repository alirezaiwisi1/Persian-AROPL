(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  const root = document.documentElement;
  if (toggle && menu) {
    const set = open => {
      menu.classList.toggle('open', open); root.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-hidden', String(!open));
    };
    toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => set(false)));
    document.addEventListener('click', e => { if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width:851px)').addEventListener('change', e => { if (e.matches) set(false); });
  }
  const links = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  if (links.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });
  }
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}), {threshold:.12});
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('visible'));
})();

/* 3D books: entrance turn, hover tilt (mouse), drag-to-spin (mouse/touch), scroll-linked tilt on touch */
(() => {
  const header = document.getElementById('site-header');
  if (header) addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 30), { passive: true });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  document.querySelectorAll('.book-stage').forEach(stage => {
    const book = stage.querySelector('.book3d');
    const rest = { y: +stage.dataset.ry, x: +stage.dataset.rx };
    const cur = reduce ? { ...rest } : { y: rest.y - 70, x: rest.x + 10 };
    const tgt = { ...rest };
    let turns = 0, drag = false, px = 0, py = 0, vis = false, raf = 0;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const draw = () => {
      if (coarse && !drag) {
        const r = stage.getBoundingClientRect();
        tgt.y = rest.y + turns + ((r.top + r.height / 2) / innerHeight - .5) * -22;
      }
      cur.y += (tgt.y - cur.y) * .09; cur.x += (tgt.x - cur.x) * .09;
      book.style.setProperty('--ry', cur.y.toFixed(2) + 'deg');
      book.style.setProperty('--rx', cur.x.toFixed(2) + 'deg');
      stage.style.setProperty('--shine', (60 - (cur.y - rest.y) * 2.4).toFixed(1) + '%');
      raf = vis ? requestAnimationFrame(draw) : 0;
    };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) draw(); }, { threshold: .1 }).observe(stage);
    if (reduce) { draw(); return; }
    const end = () => { if (!drag) return; drag = false; turns = Math.round((tgt.y - rest.y) / 360) * 360; tgt.y = rest.y + turns; tgt.x = rest.x; };
    stage.addEventListener('pointerdown', e => { drag = true; px = e.clientX; py = e.clientY; stage.classList.add('touched'); try { stage.setPointerCapture(e.pointerId); } catch (_) {} });
    stage.addEventListener('pointermove', e => {
      if (drag) { tgt.y += (e.clientX - px) * .6; tgt.x = clamp(tgt.x - (e.clientY - py) * .25, -25, 25); px = e.clientX; py = e.clientY; }
      else if (e.pointerType === 'mouse') {
        const r = stage.getBoundingClientRect();
        tgt.y = rest.y + turns + ((e.clientX - r.left) / r.width - .5) * 30;
        tgt.x = rest.x - ((e.clientY - r.top) / r.height - .5) * 14;
      }
    });
    ['pointerup', 'pointercancel'].forEach(n => stage.addEventListener(n, end));
    stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !drag) { tgt.y = rest.y + turns; tgt.x = rest.x; } });
  });
})();

/* YouTube rails: counter, prev/next (desktop), progress bar + swipe hint (mobile), live titles */
(() => {
  const chev = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const nf = new Intl.NumberFormat('fa-IR');
  document.querySelectorAll('.youtube-block').forEach(block => {
    const sc = block.querySelector('.youtube-scroller'), heading = block.querySelector('.youtube-block-heading');
    const cards = [...sc.children], n = cards.length;
    heading.insertAdjacentHTML('beforeend', `<div class="rail-nav"><button class="rail-btn" data-d="1" type="button" aria-label="قبلی">${chev('m9 6 6 6-6 6')}</button><span class="rail-count" aria-live="polite"></span><button class="rail-btn" data-d="-1" type="button" aria-label="بعدی">${chev('m15 6-6 6 6 6')}</button></div>`);
    sc.insertAdjacentHTML('afterend', `<div class="rail-foot" aria-hidden="true"><div class="rail-track"><i class="rail-thumb" style="--w:${100 / n}%"></i></div><div class="rail-hint"><i>‹</i><span>بکشید تا ویدیوهای بعدی را ببینید</span></div></div>`);
    const count = block.querySelector('.rail-count'), thumb = block.querySelector('.rail-thumb');
    const [prev, next] = block.querySelectorAll('.rail-btn');
    const rtl = getComputedStyle(sc).direction === 'rtl';
    const update = () => {
      const max = sc.scrollWidth - sc.clientWidth, p = max > 0 ? Math.min(1, Math.abs(sc.scrollLeft) / max) : 0;
      const nv = Math.max(0, n - 1); /* video count excludes the channel-entry card */
      const i = Math.min(nv, Math.max(1, Math.round(p * (n - 1))));
      count.textContent = `${nf.format(i)} / ${nf.format(nv)}`;
      thumb.style.setProperty('--p', p.toFixed(3));
      prev.disabled = p < .02; next.disabled = p > .98;
      if (p > .02) block.classList.add('moved');
    };
    sc.addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
    [prev, next].forEach(b => b.addEventListener('click', () => {
      const step = cards[1].getBoundingClientRect().width + 14;
      const forward = b === next ? 1 : -1; sc.scrollBy({ left: forward * step * (rtl ? -1 : 1), behavior: 'smooth' });
    }));
  });
  document.querySelectorAll('a[data-auto-title]').forEach(a => {
    fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(a.href))
      .then(r => r.ok ? r.json() : Promise.reject()).then(j => {
        if (!j.title) return; const h = a.querySelector('h3'); h.textContent = j.title; a.querySelector('img').alt = j.title;
      }).catch(() => {});
  });
})();
