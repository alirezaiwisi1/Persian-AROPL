/* TikTok LIVE status — polls GET {TIKTOK_API_BASE}/api/status and drives the
   LIVE experience: live-first ordering, the official-account spotlight and the
   global LIVE alert.

   The request contract and the LIVE detection are untouched — same endpoint,
   same payload shape, same refresh interval, same visibility handling, same
   failure behaviour. Everything below only adds presentation on top of it, and
   it stays fully isolated: any failure affects this UI and nothing else. */
(() => {
  const cfg = window.AROPL_CONFIG || {};
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const base = String(cfg.TIKTOK_API_BASE || (local ? 'http://localhost:3000' : '')).replace(/\/+$/, '');
  const every = Math.max(10000, Number(cfg.TIKTOK_REFRESH_MS) || 30000);
  const TIMEOUT = 8000;
  const nf = new Intl.NumberFormat('fa-IR');
  const label = { live: 'زنده', offline: 'آفلاین', unknown: 'نامشخص', loading: 'در حال بررسی' };

  /* ---------- page hooks (all optional: inner pages have no #live grid) --- */
  const section = document.getElementById('live');
  const cards = section ? [...section.querySelectorAll('.live-card[data-username]')] : [];
  const summary = section ? section.querySelector('.live-summary') : null;
  const note = section ? section.querySelector('.live-note') : null;
  const rail = section ? section.querySelector('.live-status') : null;
  const railBadge = section ? section.querySelector('.live-status-badge') : null;
  const railNum = railBadge ? railBadge.querySelector('.live-status-num') : null;
  const byName = new Map(cards.map(c => [c.dataset.username.toLowerCase(), c]));
  const docIndex = new Map(cards.map((c, i) => [c, i]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- shared roster: real display names for the LIVE alert -------- */
  const roster = Array.isArray(window.AROPL_TIKTOK_ACCOUNTS) ? window.AROPL_TIKTOK_ACCOUNTS : [];
  const official = (roster.find(r => r.official) || {}).username || '';
  const rank = new Map(roster.map((r, i) => [r.username.toLowerCase(), i]));
  const nameOf = u => {
    const hit = roster.find(r => r.username.toLowerCase() === u.toLowerCase());
    return hit ? hit.name : u;
  };
  const avatarOf = u => 'assets/images/tiktok/' + u + '.webp';

  let timer = 0, busy = false, hasData = false, ctrl = null;
  let prevLive = new Set();
  let dismissed = false;

  /* ---------- cards ------------------------------------------------------- */
  const setCard = (card, state, stale) => {
    card.dataset.state = state;
    card.classList.toggle('is-stale', !!stale);
    const t = card.querySelector('.live-badge-text');
    if (t) t.textContent = label[state];
    const a = card.querySelector('.live-action-text');
    if (a) a.textContent = state === 'live' ? 'تماشای پخش زنده' : 'مشاهده پروفایل';
  };

  const sectionOnScreen = () => {
    if (!section) return false;
    const r = section.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  };

  /* LIVE accounts rise to the top; everything else keeps its document order.
     The official channel always keeps the very first slot, LIVE or offline.
     Reordering is animated with a small FLIP pass, but only when the grid is
     actually on screen and motion is welcome. */
  const orderCards = live => {
    if (!cards.length) return;
    const animate = !reduceMotion && sectionOnScreen();
    const before = animate ? new Map(cards.map(c => [c, c.getBoundingClientRect()])) : null;

    const sorted = cards.slice().sort((a, b) => {
      const oa = a.dataset.featured === '1' ? 0 : 1;
      const ob = b.dataset.featured === '1' ? 0 : 1;
      if (oa !== ob) return oa - ob;
      const la = live.has(a.dataset.username.toLowerCase()) ? 0 : 1;
      const lb = live.has(b.dataset.username.toLowerCase()) ? 0 : 1;
      if (la !== lb) return la - lb;
      return docIndex.get(a) - docIndex.get(b);
    });

    sorted.forEach((c, i) => { c.style.order = String(i + 1); });
    if (!before) return;

    requestAnimationFrame(() => {
      sorted.forEach(c => {
        const f = before.get(c), l = c.getBoundingClientRect();
        const dx = f.left - l.left, dy = f.top - l.top;
        if (!dx && !dy) return;
        c.animate(
          [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'translate(0, 0)' }],
          { duration: 460, easing: 'cubic-bezier(.22,.8,.28,1)' }
        );
      });
    });
  };

  /* ---------- global LIVE alert ------------------------------------------ */
  const sticky = (document.body.dataset.liveBanner || (section ? 'sticky' : 'timed')) === 'sticky';
  const AUTO_HIDE = 10000; // inner pages: hide 10s after a session starts
  let alertEl = null, facesEl = null, titleEl = null, subEl = null, alertTimer = 0, hideTimer = 0;

  const buildAlert = () => {
    if (alertEl) return;
    alertEl = document.createElement('div');
    alertEl.className = 'live-alert';
    alertEl.id = 'live-alert';
    alertEl.hidden = true;
    alertEl.setAttribute('role', 'status');
    alertEl.setAttribute('aria-live', 'polite');
    alertEl.innerHTML =
      '<a class="live-alert-main" href="' + (section ? '#live' : 'index.html#live') + '">' +
        '<span class="live-alert-chip"><i class="live-alert-dot" aria-hidden="true"></i>LIVE</span>' +
        '<span class="live-alert-faces" aria-hidden="true"></span>' +
        '<span class="live-alert-copy">' +
          '<strong class="live-alert-title"></strong>' +
          '<small class="live-alert-sub"></small>' +
        '</span>' +
      '</a>' +
      '<button class="live-alert-close" type="button" aria-label="بستن اعلان پخش زنده">&times;</button>';
    facesEl = alertEl.querySelector('.live-alert-faces');
    titleEl = alertEl.querySelector('.live-alert-title');
    subEl = alertEl.querySelector('.live-alert-sub');
    alertEl.querySelector('.live-alert-close').addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      dismissed = true;
      hideAlert();
    });
    document.body.appendChild(alertEl);
  };

  const hideAlert = () => {
    if (!alertEl) return;
    clearTimeout(alertTimer);
    clearTimeout(hideTimer);
    alertEl.classList.remove('is-visible');
    document.documentElement.classList.remove('has-live-alert');
    hideTimer = setTimeout(() => {
      if (alertEl && !alertEl.classList.contains('is-visible')) alertEl.hidden = true;
    }, 460);
  };

  const showAlert = () => {
    if (!alertEl) return;
    clearTimeout(alertTimer);
    clearTimeout(hideTimer);
    if (!alertEl.classList.contains('is-visible')) {
      alertEl.hidden = false;
      void alertEl.offsetWidth; // flush so the slide-in transition runs
      alertEl.classList.add('is-visible');
    }
    // Keep anchor targets clear of the docked alert.
    document.documentElement.classList.add('has-live-alert');
    if (!sticky) alertTimer = setTimeout(hideAlert, AUTO_HIDE);
  };

  /* Official channel first, then the remaining live accounts in roster order. */
  const sortLive = live => live.slice().sort((a, b) => {
    const oa = a === official ? 0 : 1;
    const ob = b === official ? 0 : 1;
    if (oa !== ob) return oa - ob;
    return (rank.get(a) === undefined ? 99 : rank.get(a)) - (rank.get(b) === undefined ? 99 : rank.get(b));
  });

  /* Handles any number of simultaneous sessions: avatar stack + names, with a
     "+N" bubble once more than three accounts are live. */
  const paintAlert = live => {
    buildAlert();
    const list = sortLive(live);
    facesEl.textContent = '';
    list.slice(0, 3).forEach(u => {
      const img = document.createElement('img');
      img.src = avatarOf(u);
      img.alt = '';
      img.width = 30;
      img.height = 30;
      img.decoding = 'async';
      facesEl.appendChild(img);
    });
    if (list.length > 3) {
      const more = document.createElement('span');
      more.className = 'live-alert-more';
      more.textContent = '+' + nf.format(list.length - 3);
      facesEl.appendChild(more);
    }
    titleEl.textContent = nf.format(list.length) + ' حساب در حال پخش زنده';
    subEl.textContent = list.map(nameOf).join(' · ');
  };

  const syncAlert = (live, freshSession) => {
    if (!live.length) { dismissed = false; hideAlert(); return; }
    paintAlert(live);
    // A new session always wins: it clears any dismissal and starts the clock.
    if (freshSession) { dismissed = false; showAlert(); return; }
    if (dismissed) return;
    // Otherwise only the home page keeps an alert on screen. Inner pages must
    // never re-arm the 10s timer here, or a refresh poll would extend it.
    if (sticky && !alertEl.classList.contains('is-visible')) showAlert();
  };

  /* ---------- data ------------------------------------------------------- */
  const render = (data) => {
    const live = new Set();
    (Array.isArray(data.live) ? data.live : []).forEach(a => {
      if (a && a.isLive === true && typeof a.username === 'string') live.add(a.username.toLowerCase());
    });
    const off = new Set();
    (Array.isArray(data.offline) ? data.offline : []).forEach(a => {
      if (a && typeof a.username === 'string') off.add(a.username.toLowerCase());
    });
    let n = 0;
    byName.forEach((card, name) => {
      if (live.has(name)) { setCard(card, 'live'); n++; }
      else if (off.has(name)) setCard(card, 'offline');
      else setCard(card, 'unknown');
    });

    const liveList = [...live];
    const freshSession = !hasData || liveList.some(u => !prevLive.has(u));
    prevLive = live;

    if (summary) {
      summary.textContent = n ? `${nf.format(n)} حساب در حال پخش زنده است` : 'در حال حاضر پخش زنده‌ای در جریان نیست';
      summary.classList.toggle('has-live', n > 0);
    }
    if (rail) rail.dataset.state = n > 0 ? 'live' : 'idle';
    if (railBadge) railBadge.hidden = n === 0;
    if (railNum) railNum.textContent = nf.format(n);

    orderCards(live);
    syncAlert(liveList, freshSession);

    let when = '';
    const d = new Date(data.checkedAt);
    if (data.checkedAt && !isNaN(d)) when = ' · آخرین بررسی ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    if (note) {
      note.textContent = 'به‌روزرسانی خودکار' + when;
      note.classList.remove('is-error');
    }
    hasData = true;
  };

  const fail = () => {
    if (hasData) cards.forEach(c => c.classList.add('is-stale'));
    else cards.forEach(c => setCard(c, 'unknown'));
    if (summary) {
      summary.classList.remove('has-live');
      if (!hasData) summary.textContent = 'وضعیت پخش زنده در دسترس نیست';
    }
    if (rail) rail.dataset.state = 'error';
    if (railBadge) railBadge.hidden = true;
    if (note) {
      note.textContent = base ? 'ارتباط با سرور برقرار نشد؛ دوباره تلاش می‌کنیم.' : 'آدرس سرویس وضعیت تنظیم نشده است.';
      note.classList.add('is-error');
    }
    if (!hasData) hideAlert();
  };

  const load = async () => {
    if (busy) return;
    if (!base) { fail(); return; }
    busy = true;
    ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT);
    try {
      const r = await fetch(base + '/api/status', { signal: ctrl.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      if (!data || typeof data !== 'object' || (!Array.isArray(data.live) && !Array.isArray(data.offline))) throw new Error('bad payload');
      render(data);
    } catch (_) {
      fail();
    } finally {
      clearTimeout(t); busy = false;
    }
  };

  const start = () => { stop(); load(); timer = setInterval(load, every); };
  const stop = () => { clearInterval(timer); timer = 0; if (ctrl) ctrl.abort(); };

  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  if (!document.hidden) start();
})();
