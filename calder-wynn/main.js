// Calder & Wynn 2026 demo: nav, menu, dock, strips, listing cards and filters, the booking steps,
// the WhatsApp chat and the photo gallery.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = $('#nav');
  const dock = $('#dock');
  const hero = $('.hero');

  /* nav: solid once the hero has scrolled under it (always solid on the inner pages) */
  // version B: scrolling down, the bar scrolls away with the hero (the logo stays in its cut-out) and the floating bar
  // drops in once past it; scrolling back up, the floating bar stays until the very top, then slips back into place
  const framedNav = !!hero && document.body.classList.contains('framed');
  const onScroll = () => {
    const solid = !hero || window.scrollY > hero.offsetHeight - 90;
    if (framedNav) {
      if (solid) nav.classList.add('is-solid');
      else if (window.scrollY <= 1) nav.classList.remove('is-solid');
    } else nav.classList.toggle('is-solid', solid);
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  setTimeout(onScroll, 2400); // after the logo intro, which holds the page still

  /* the dock shows once the visitor has left the landing screen */
  let pastHero = !hero;
  const setDock = () => dock && dock.classList.toggle('is-on', pastHero && !document.body.classList.contains('is-locked'));
  const fabEl = document.querySelector('.wa-fab');
  if (hero) document.body.classList.add('has-hero');
  const setFab = () => fabEl && fabEl.classList.toggle('is-on', pastHero);
  // on a phone's landing screen, lift the button above the hero text so it never covers the hero buttons
  const placeFab = () => {
    if (!fabEl || !hero) return;
    const label = document.querySelector('.hero .label');
    const pill = document.querySelector('[data-open-hours] summary');
    const lift = window.innerHeight - label.getBoundingClientRect().top - window.scrollY * 0 + 14;
    const fabTop = window.innerHeight - lift - fabEl.offsetHeight;
    const pillBottom = pill ? pill.getBoundingClientRect().bottom : 0;
    const room = fabTop > pillBottom + 10;
    fabEl.style.setProperty('--fab-hero-bottom', room ? Math.round(lift) + 'px' : '96px');
    fabEl.classList.toggle('is-tucked', !room); // no room beside the hero's words: wait until the visitor scrolls on
  };
  if (hero) { placeFab(); window.addEventListener('resize', placeFab); document.fonts?.ready.then(placeFab); }
  if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; setDock(); setFab(); }, { threshold: 0.15 }).observe(hero);
  else window.addEventListener('scroll', () => { pastHero = window.scrollY > 420; setDock(); }, { passive: true });
  const lock = (on) => { document.body.classList.toggle('is-locked', on); setDock(); };

  /* menu: a dropdown that opens under the menu button; the same button (now an X) closes it */
  const sheet = $('#sheet');
  const openBtn = $('[data-menu-open]');
  const isOpen = () => sheet.classList.contains('is-open');
  const place = () => {
    const r = openBtn.getBoundingClientRect();
    sheet.style.top = `${Math.round(r.bottom + 10)}px`;
    sheet.style.right = `${Math.max(12, Math.round(innerWidth - r.right))}px`;
  };
  const setMenu = (open) => {
    if (open) place();
    sheet.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    openBtn.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu');
    $('use', openBtn)?.setAttribute('href', open ? '#close' : '#menu');
    if (!open && sheet.contains(document.activeElement)) openBtn.focus({ preventScroll: true });
  };
  openBtn.addEventListener('click', () => setMenu(!isOpen()));
  window.addEventListener('scroll', () => { if (isOpen()) place(); }, { passive: true });
  $$('[data-menu-link]', sheet).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) setMenu(false); });
  document.addEventListener('click', (e) => { if (isOpen() && !sheet.contains(e.target) && !openBtn.contains(e.target)) setMenu(false); });
  addEventListener('scroll', () => { if (isOpen()) place(); }, { passive: true });
  addEventListener('resize', () => { if (isOpen()) place(); });

  /* the strips loop seamlessly at one fixed speed: nothing pauses, slows or stops them */
  $$('.strip__track').forEach((track) => {
    [...track.children].forEach((chip) => { const c = chip.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  });
  /* version B: the top-left cut-out is sized to hold the logo and (from tablet up) the open-hours pill */
  const notch = $('[data-notch]');
  const sizeNotch = () => {
    if (!notch || !document.body.classList.contains('framed')) return;
    const hr = hero.getBoundingClientRect();
    const top0 = hr.top + window.scrollY;
    const lr = $('.nav .logo').getBoundingClientRect();
    const pill = $('[data-open-hours] summary');
    const pr = pill.getBoundingClientRect();
    const wide = window.innerWidth >= 640;
    const w = Math.max(lr.right - hr.left, wide ? pr.right - hr.left : 0) + 18;
    const h = (wide ? pr.bottom + window.scrollY - top0 : lr.bottom - top0) + 14;
    notch.style.setProperty('--notch-w', `${Math.round(w)}px`);
    notch.style.setProperty('--notch-h', `${Math.round(h)}px`);
  };
  window.addEventListener('resize', sizeNotch);
  document.fonts?.ready.then(sizeNotch);

  /* open hours on the landing screen: live open/closed in Cape Town time; the card starts open on a desktop */
  const hours = $('[data-open-hours]');
  if (hours) {
    const HOURS = { 4: [9, 18], 5: [9, 18], 6: [9, 16], 0: [11, 15] };
    const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const dow = DAY.indexOf(parts.weekday.slice(0, 3));
    const hr = +parts.hour + +parts.minute / 60;
    const today = HOURS[dow];
    const open = today && hr >= today[0] && hr < today[1];
    let text;
    if (open) text = `Open now · until ${String(today[1]).padStart(2, '0')}:00`;
    else {
      let d = dow, i = 0;
      if (today && hr < today[0]) text = `Closed · opens ${String(today[0]).padStart(2, '0')}:00`;
      else { do { d = (d + 1) % 7; i++; } while (!HOURS[d] && i < 7); text = `Closed · opens ${DAY[d]} ${String(HOURS[d][0]).padStart(2, '0')}:00`; }
    }
    $('[data-open-status]', hours).textContent = text;
    hours.classList.toggle('is-open', !!open);
    $$('[data-days]', hours).forEach((row) => row.classList.toggle('is-today', row.dataset.days.split(',').includes(String(dow))));
    sizeNotch();
  }

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- saved homes: the heart needs an account, so the first tap opens the sign-up ----------
     DEMO: the account and the saved list live in localStorage. For a real client, swap store.* for Supabase Auth + a table. */
  const ACC = 'cw-account', SAVED = 'cw-saved';
  const store = {
    get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: this visit only */ } },
  };
  const saved = new Set(store.get(SAVED, []));
  const hearts = $$('[data-save]');
  const toast = (msg) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('p'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('is-on'), 2600);
  };
  const paintHearts = () => {
    hearts.forEach((b) => {
      const on = saved.has(b.dataset.save);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? `Remove ${b.dataset.saveName} from your saved homes` : `Save ${b.dataset.saveName}`);
    });
    $$('[data-saved-count]').forEach((c) => { c.textContent = saved.size; });
  };
  const setSaved = (id, on) => {
    if (on) saved.add(id); else saved.delete(id);
    store.set(SAVED, [...saved]); paintHearts();
    dispatchEvent(new Event('saved:change'));
  };
  const dlg = $('[data-signup]');
  let pending = null, signIn = false, openSignup = null;
  if (dlg) {
    const form = $('[data-signup-form]', dlg);
    const status = $('[data-signup-status]', dlg);
    const mode = (inMode) => {
      signIn = inMode;
      $('[data-signup-title]', dlg).textContent = signIn ? 'Sign in' : 'Save this home';
      $('[data-signup-lead]', dlg).textContent = signIn ? 'Enter the email you signed up with to see your saved homes.' : "Make a free account to keep the homes you like in one place. We'll tell you if the price changes or an offer comes in.";
      $$('[data-signup-only]', dlg).forEach((el) => { el.hidden = signIn; });
      $('[data-signup-submit] span', dlg).textContent = signIn ? 'Sign in and save' : 'Create account and save';
      $('[data-signup-ask]', dlg).textContent = signIn ? 'New here?' : 'Already have an account?';
      $('[data-signup-mode]', dlg).textContent = signIn ? 'Make an account' : 'Sign in';
      status.textContent = '';
    };
    const open = (btn) => {
      pending = btn; mode(false); form.reset();
      const d = btn.dataset;
      $('[data-signup-home]', dlg).innerHTML = `<img src="${d.saveImg}" alt="" width="84" height="63"><span><b>${d.savePrice}</b><span>${d.saveName}</span><small>${d.saveWhere}</small></span>`;
      dlg.showModal();
    };
    openSignup = open;
    $('[data-signup-mode]', dlg).addEventListener('click', () => mode(!signIn));
    $('[data-signup-close]', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); }); // tap outside the card
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim(), email = form.email.value.trim();
      const bad = !signIn && !name ? ['name', 'Please add your name.']
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? ['email', 'Please check your email address.']
        : !signIn && !form.agree.checked ? ['agree', 'Please tick the box so we can keep your saved homes.'] : null;
      if (bad) { status.textContent = bad[1]; form[bad[0]].focus(); return; }
      const acc = store.get(ACC, null);
      store.set(ACC, { name: signIn ? (acc?.email === email ? acc.name : '') : name, email });
      dlg.close();
      if (pending) { setSaved(pending.dataset.save, true); toast(`${pending.dataset.saveName} saved. Find it under Saved on the listings page.`); pending.focus(); }
    });
  }
  hearts.forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!store.get(ACC, null) && openSignup) { openSignup(b); return; }
    const on = !saved.has(b.dataset.save);
    setSaved(b.dataset.save, on);
    toast(on ? `${b.dataset.saveName} saved` : `${b.dataset.saveName} removed from your saved homes`);
  }));
  paintHearts();

  /* ---------- listing cards: swipe through the photos (arrows on a desktop), with a 1/7 counter ---------- */
  $$('[data-ph]').forEach((ph) => {
    const track = $('[data-ph-track]', ph), count = $('[data-ph-count]', ph);
    const prev = $('[data-ph-prev]', ph), next = $('[data-ph-next]', ph);
    const slides = [...track.children], n = slides.length;
    // photos 2+ load only when needed: the second once the card is near the screen (so a swipe never shows a gap), the rest on first touch
    const fill = (k) => { const im = slides[k]?.querySelector('img[data-src]'); if (im) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); } };
    const fillAll = () => slides.forEach((_, k) => fill(k));
    new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { fill(1); io.disconnect(); } }, { rootMargin: '200px' }).observe(ph);
    ['pointerenter', 'touchstart', 'focusin'].forEach((ev) => ph.addEventListener(ev, fillAll, { once: true, passive: true }));
    track.addEventListener('scroll', fillAll, { once: true, passive: true });
    const at = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
    const update = () => {
      const k = Math.min(n - 1, Math.max(0, at()));
      count.textContent = `${k + 1}/${n}`;
      prev.disabled = k === 0; next.disabled = k === n - 1;
      slides.forEach((s, j) => { s.tabIndex = j === k ? 0 : -1; });
    };
    const go = (d) => { track.scrollTo({ left: (at() + d) * track.clientWidth, behavior: calm ? 'auto' : 'smooth' }); setTimeout(update, 450); };
    prev.addEventListener('click', (e) => { e.preventDefault(); go(-1); });
    next.addEventListener('click', (e) => { e.preventDefault(); go(1); });
    track.addEventListener('scroll', update, { passive: true });
    update();
  });

  /* ---------- slideshows of the listings' exterior photos: the home page's listings band, and the hero once its film has ended ---------- */
  // a seamless cross-fade: the next photo is decoded before it starts, fades in over the current one (which stays put
  // underneath), and every photo drifts slowly from the moment it appears until it has gone, so nothing ever jumps
  const EVERY = 3000;
  const ready = (im) => {
    if (!im.getAttribute('src') && im.dataset.src) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; }
    im.loading = 'eager';
    return im.decode ? im.decode().catch(() => {}) : Promise.resolve();
  };
  // a horizontal swipe on the slideshow; vertical scrolling is left to the page, and buttons and links inside keep working
  const swipe = (el, prev, next) => {
    let x0 = null, y0 = 0, moved = false;
    el.addEventListener('pointerdown', (e) => {
      if ((e.pointerType === 'mouse' && e.button !== 0) || e.target.closest('button, summary, details, .btn, .hero__cap, .hero__cut')) return;
      x0 = e.clientX; y0 = e.clientY; moved = false;
    });
    el.addEventListener('pointermove', (e) => { if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true; });
    const end = (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) (dx < 0 ? next : prev)();
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', () => { x0 = null; });
    el.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true); // a swipe is not a tap
    el.addEventListener('dragstart', (e) => e.preventDefault()); // no ghost image when dragging with a mouse
  };
  const runShow = (box, imgs, dashes, cap) => {
    let i = 0, on = true, busy = false;
    const mark = () => {
      dashes.forEach((dd, k) => { dd.classList.toggle('is-done', k < i); dd.classList.remove('is-on'); });
      if (dashes[i]) { void dashes[i].offsetWidth; dashes[i].classList.add('is-on'); }
      if (cap) { cap.textContent = imgs[i].dataset.cap; if (imgs[i].dataset.href) cap.href = imgs[i].dataset.href; }
    };
    const show = (n) => {
      if (busy) return; busy = true;
      const next = (n + imgs.length) % imgs.length, cur = imgs[i], im = imgs[next];
      ready(im).then(() => {
        imgs.forEach((x) => { if (x !== cur) x.classList.remove('is-prev'); });
        cur.classList.remove('is-on'); cur.classList.add('is-prev');
        im.classList.add('is-on');
        i = next; mark(); busy = false;
        setTimeout(() => cur.classList.remove('is-prev'), 1400); // once the new photo fully covers it
        ready(imgs[(i + 1) % imgs.length]); // get the one after ready in good time
      });
    };
    mark();
    let timer = 0;
    const loop = () => { clearTimeout(timer); if (!calm) timer = setTimeout(() => { if (on && !document.hidden) show(i + 1); loop(); }, EVERY); };
    // swipe (or drag with a mouse) left or right to move by hand; the timer starts again from there
    swipe(box, () => { show(i - 1); loop(); }, () => { show(i + 1); loop(); });
    if (calm) return;
    ready(imgs[1 % imgs.length]);
    new IntersectionObserver(([e]) => { on = e.isIntersecting; box.classList.toggle('is-paused', !on); }).observe(box);
    loop();
  };
  const band = $('[data-show]');
  if (band) runShow(band, $$('.show__img', band), $$('.show__bar i', band), $('[data-show-cap]', band));
  const heroShow = $('[data-hero-show]');
  if (heroShow && !calm) {
    const bar = $('[data-hero-bar]');
    let begun = false;
    const begin = () => {
      if (begun) return; begun = true;
      const imgs = $$('.hero__slide', heroShow);
      // only the first photo now; runShow readies each next one a slide ahead
      ready(imgs[0]).then(() => {
        imgs[0].classList.add('is-on');
        bar?.classList.add('is-on');
        runShow($('.hero'), imgs, bar ? $$('i', bar) : [], $('[data-hero-cap]'));
      });
    };
    // first visit: wait for the film to end and the hero to settle; later visits: a moment on the still first
    if (document.documentElement.classList.contains('hero-film')) {
      addEventListener('hero:settled', () => setTimeout(begin, 1200), { once: true });
      setTimeout(begin, 16000); // safety net
    } else setTimeout(begin, 1500);
  }

  /* ---------- listings: filter by region, beds and price, sort, saved only; 10 at a time; the map pins follow the list ---------- */
  const filters = $('[data-filters]');
  if (filters) {
    const list = $('[data-list]');
    const cards = $$('[data-card]', list);
    const count = $('[data-count]');
    const empty = $('[data-empty]');
    const spot = $('[data-spot]');
    const onlySaved = $('[data-saved-only]');
    const pins = new Map($$('[data-pin]').map((p) => [p.dataset.pin, p]));
    const moreBtn = $('[data-more-homes]');
    const PAGE = 10;
    let limit = PAGE;
    const sorts = { 'price-asc': (c) => +c.dataset.price, 'price-desc': (c) => -c.dataset.price, views: (c) => -c.dataset.views, sqm: (c) => -c.dataset.sqm };
    const apply = () => {
      const area = filters.area.value;
      const beds = +filters.beds.value || 0;
      const [lo, hi] = (filters.price.value || '0-999999999').split('-').map(Number);
      const mine = onlySaved?.getAttribute('aria-pressed') === 'true';
      const key = sorts[filters.sort.value] || sorts['price-asc'];
      cards.sort((a, b) => key(a) - key(b)).forEach((c) => list.appendChild(c));
      let shown = 0;
      cards.forEach((c) => {
        const p = +c.dataset.price;
        const ok = (!area || c.dataset.region === area) && +c.dataset.beds >= beds && p >= lo && p < hi && (!mine || saved.has(c.dataset.id));
        if (ok) shown++;
        c.classList.toggle('is-out', !ok);
        c.hidden = !ok || shown > limit; // filtered out, or past the 'show more' line
        pins.get(c.dataset.id)?.classList.toggle('is-off', !ok);
      });
      const spotOn = !mine || (spot && saved.has(spot.dataset.spot));
      if (spot) { spot.hidden = !spotOn; pins.get(spot.dataset.spot)?.classList.toggle('is-off', !spotOn); }
      const n = shown + (mine && spotOn ? 1 : 0);
      const left = shown - limit;
      if (moreBtn) { moreBtn.hidden = left <= 0; moreBtn.textContent = `Show ${Math.min(PAGE, left)} more ${Math.min(PAGE, left) === 1 ? 'home' : 'homes'} (${left} left)`; }
      count.textContent = mine ? `${n} saved ${n === 1 ? 'home' : 'homes'}`
        : `${shown} more ${shown === 1 ? 'home' : 'homes'}${area ? ` in ${area}` : ' on our books'}`;
      empty.hidden = mine ? n > 0 : shown > 0;
      // the Filters button shows how many of its filters are on; the panel's button shows the result count
      const on = (beds ? 1 : 0) + (filters.price.value ? 1 : 0);
      const badge = $('[data-filter-count]'); if (badge) { badge.hidden = !on; badge.textContent = on; }
      const done = $('[data-filter-done]'); if (done) done.textContent = n === 1 ? 'Show 1 home' : `Show ${n} homes`;
    };
    const q = new URLSearchParams(location.search);
    if (q.get('area')) filters.area.value = q.get('area');
    if (q.get('price')) filters.price.value = q.get('price');
    filters.addEventListener('change', () => { limit = PAGE; apply(); });
    moreBtn?.addEventListener('click', () => {
      const first = cards.find((c) => c.hidden && !c.classList.contains('is-out'));
      limit += PAGE; apply();
      first?.querySelector('.hrow__link')?.focus({ preventScroll: true }); // keyboard users land on the first new home
    });
    filters.addEventListener('reset', () => { onlySaved?.setAttribute('aria-pressed', 'false'); limit = PAGE; setTimeout(apply); });
    $('[data-clear]')?.addEventListener('click', () => filters.reset());
    onlySaved?.addEventListener('click', () => {
      if (!store.get(ACC, null) && !saved.size) { toast('Tap the heart on a home to save it'); return; }
      onlySaved.setAttribute('aria-pressed', String(onlySaved.getAttribute('aria-pressed') !== 'true')); apply();
    });
    addEventListener('saved:change', apply);
    // hovering a card lights its pin, and the other way round
    cards.forEach((c) => {
      const p = pins.get(c.dataset.id);
      if (!p) return;
      const on = (v) => { c.classList.toggle('is-hot', v); p.classList.toggle('is-hot', v); };
      c.addEventListener('pointerenter', () => on(true)); c.addEventListener('pointerleave', () => on(false));
      c.addEventListener('focusin', () => on(true)); c.addEventListener('focusout', () => on(false));
      p.addEventListener('pointerenter', () => on(true)); p.addEventListener('pointerleave', () => on(false));
      p.addEventListener('focus', () => on(true)); p.addEventListener('blur', () => on(false));
    });
    // the Filters panel: grows out of its button; closes on Done, Esc, or a tap outside
    const fBtn = $('[data-filter-open]'), panel = $('[data-filter-panel]');
    if (fBtn && panel) {
      const setOpen = (v) => { panel.classList.toggle('is-open', v); fBtn.setAttribute('aria-expanded', String(v)); if (v) setTimeout(() => $('select', panel).focus({ preventScroll: true }), 60); };
      fBtn.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
      $('[data-filter-done]', panel).addEventListener('click', () => { setOpen(false); fBtn.focus(); });
      $('[data-filter-clear]', panel).addEventListener('click', () => { filters.beds.value = '0'; filters.price.value = ''; filters.sort.value = 'views'; filters.dispatchEvent(new Event('change')); });
      document.addEventListener('click', (e) => { if (panel.classList.contains('is-open') && !e.target.closest('.lx__filter')) setOpen(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('is-open')) { setOpen(false); fBtn.focus(); } });
    }
    // tablets and phones: the map sits behind a Map button
    const toggle = $('[data-map-toggle]');
    toggle?.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      $('[data-split]').classList.toggle('is-map', open);
    });
    apply();
  }

  /* ---------- live availability (demo: made up per house and day, plus anything booked on this device) ---------- */
  const SLOTS = { 4: ['10:00', '11:30', '14:00', '16:00'], 5: ['10:00', '11:30', '15:00'], 6: ['09:30', '11:00', '13:30', '15:00'], 0: ['11:00', '13:00', '14:30'] };
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
  const booked = () => { try { return JSON.parse(localStorage.getItem('cw-bookings') || '[]'); } catch { return []; } };
  const today0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const freeTimes = (house, d) => {
    const slots = SLOTS[d.getDay()] || [];
    const k = key(d);
    const now = new Date();
    const mine = booked();
    if (hash(house + k + 'full') < 0.12) return slots.map((t) => [t, false]);
    return slots.map((t) => {
      const [hh, mm] = t.split(':').map(Number);
      const at = new Date(d); at.setHours(hh, mm);
      const free = at - now > 60 * 60 * 1000 && hash(house + k + t) > 0.28 && !mine.some((b) => b.house === house && b.date === k && b.time === t);
      return [t, free];
    });
  };
  const dayState = (house, d) => {
    const max = today0(); max.setDate(max.getDate() + 70);
    if (!SLOTS[d.getDay()] || d < today0() || d > max) return 'closed';
    return freeTimes(house, d).some(([, f]) => f) ? 'free' : 'full';
  };
  const fmtDay = (d) => d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  /* listing page: the next free viewing */
  $$('[data-next-free]').forEach((el) => {
    const house = el.dataset.nextFree;
    const d = today0();
    for (let i = 0; i < 70; i++, d.setDate(d.getDate() + 1)) {
      const f = dayState(house, d) === 'free' && freeTimes(house, d).find(([, ok]) => ok);
      if (f) { el.textContent = `Next free viewing: ${d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}, ${f[0]}`; break; }
    }
  });

  /* ---------- booking: house, then day and time, then details ---------- */
  const steps = $$('[data-step]');
  if (steps.length) {
    const state = { house: null, name: '', date: null, time: null };
    const stepper = $$('[data-stepper] li');
    const show = (n) => {
      steps.forEach((s) => { s.hidden = s.dataset.step !== String(n); });
      stepper.forEach((li, i) => { li.classList.toggle('is-done', n === 'done' || i + 1 < n); li.classList.toggle('is-now', i + 1 === n); });
      const panel = $(`[data-step="${n}"]`);
      window.scrollTo({ top: Math.max(0, $('.stepper').getBoundingClientRect().top + window.scrollY - 110), behavior: reduced ? 'auto' : 'smooth' });
      if (n === 'done') panel.focus({ preventScroll: true });
    };
    const sum = () => {
      $('[data-sum-house]').textContent = state.house ? state.name : 'Not chosen yet';
      $('[data-sum-day]').textContent = state.date ? state.date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }) : '–';
      $('[data-sum-time]').textContent = state.time || '–';
    };

    /* step 1 */
    const s1 = $('[data-step="1"]');
    const radios = $$('input[name="house"]', s1);
    const pickHouse = (r) => {
      state.house = r.value; state.name = r.dataset.name; state.date = null; state.time = null;
      $('[data-sum-img]').src = r.dataset.img; $('[data-sum-img]').alt = r.dataset.name;
      $('[data-next]', s1).disabled = false; sum();
    };
    radios.forEach((r) => r.addEventListener('change', () => pickHouse(r)));
    const find = $('[data-pick-find]');
    find?.addEventListener('input', () => {
      const q = find.value.trim().toLowerCase(); let n = 0;
      radios.forEach((r) => { const hit = !q || r.dataset.find.includes(q) || r.checked; r.closest('label').hidden = !hit; if (hit) n++; });
      $('[data-pick-none]').hidden = n > 0;
    });
    const pre = new URLSearchParams(location.search).get('house');
    const preR = radios.find((r) => r.value === pre);
    if (preR) { preR.checked = true; pickHouse(preR); }
    $('[data-next]', s1).addEventListener('click', () => { view = new Date(today0().getFullYear(), today0().getMonth(), 1); drawCal(); show(2); });

    /* step 2: the calendar and the free times */
    const s2 = $('[data-step="2"]');
    const grid = $('[data-cal-grid]');
    const next2 = $('[data-next]', s2);
    let view = new Date(today0().getFullYear(), today0().getMonth(), 1);
    const drawCal = () => {
      const first = new Date(view);
      $('[data-cal-title]').textContent = first.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
      const start = (first.getDay() + 6) % 7; // Monday first
      const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      let html = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<span class="cal__dow" aria-hidden="true">${d}</span>`).join('');
      for (let i = 0; i < start; i++) html += '<span class="day day--empty"></span>';
      for (let n = 1; n <= days; n++) {
        const d = new Date(first.getFullYear(), first.getMonth(), n);
        const st = dayState(state.house, d);
        const sel = state.date && key(state.date) === key(d);
        const note = st === 'full' ? 'Full' : st === 'free' ? `${freeTimes(state.house, d).filter(([, f]) => f).length} free` : '';
        html += `<button type="button" class="day day--${st}" data-day="${key(d)}" ${st !== 'free' ? 'disabled' : ''} aria-pressed="${sel}" aria-label="${fmtDay(d)}${st === 'full' ? ', fully booked' : st === 'closed' ? ', no viewings' : ''}">${n}<small>${note}</small></button>`;
      }
      grid.innerHTML = html;
      const t = today0();
      $('[data-cal-prev]').disabled = view.getFullYear() === t.getFullYear() && view.getMonth() === t.getMonth();
      $('[data-cal-next]').disabled = (view.getFullYear() - t.getFullYear()) * 12 + view.getMonth() - t.getMonth() >= 2;
    };
    const drawTimes = () => {
      const box = $('[data-times]');
      if (!state.date) { box.hidden = true; return; }
      box.hidden = false;
      $('[data-times-title]').textContent = `Free times on ${fmtDay(state.date)}`;
      $('[data-times-grid]').innerHTML = freeTimes(state.house, state.date).map(([t, f]) => `<button type="button" class="time" data-time="${t}" ${f ? '' : 'disabled'} aria-pressed="${state.time === t}" aria-label="${t}${f ? '' : ', taken'}">${t}</button>`).join('');
    };
    grid.addEventListener('click', (e) => {
      const b = e.target.closest('[data-day]'); if (!b || b.disabled) return;
      const [y, m, d] = b.dataset.day.split('-').map(Number);
      state.date = new Date(y, m - 1, d); state.time = null; next2.disabled = true;
      drawCal(); drawTimes(); sum();
      $('[data-times]').scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    });
    $('[data-times-grid]').addEventListener('click', (e) => {
      const b = e.target.closest('[data-time]'); if (!b || b.disabled) return;
      state.time = b.dataset.time; next2.disabled = false; drawTimes(); sum();
    });
    $('[data-cal-prev]').addEventListener('click', () => { view.setMonth(view.getMonth() - 1); drawCal(); });
    $('[data-cal-next]').addEventListener('click', () => { view.setMonth(view.getMonth() + 1); drawCal(); });
    next2.addEventListener('click', () => {
      $('[data-recap]').innerHTML = `<span><b>${state.name}</b></span><span>${fmtDay(state.date)}</span><span><b>${state.time}</b>, one hour</span><button type="button" data-change>Change</button>`;
      $('[data-change]').addEventListener('click', () => show(2));
      show(3);
    });
    // live: availability is re-read every 30 seconds and when another tab books a slot
    const refresh = () => {
      if (!state.house || s2.hidden) return;
      if (state.date && state.time && !freeTimes(state.house, state.date).find(([t, f]) => t === state.time && f)) { state.time = null; next2.disabled = true; sum(); }
      drawCal(); drawTimes();
    };
    setInterval(refresh, 30000);
    window.addEventListener('storage', refresh);

    /* step 3: details, then confirm */
    $$('[data-back]').forEach((b) => b.addEventListener('click', () => show(+b.closest('[data-step]').dataset.step - 1)));
    const form = $('[data-details]');
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      let first = null, n = 0;
      $$('[required]', form).forEach((f) => {
        const v = f.value.trim();
        const bad = !v || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) || (f.type === 'tel' && v.replace(/\D/g, '').length < 9);
        f.setAttribute('aria-invalid', String(bad));
        document.getElementById(f.getAttribute('aria-describedby')).hidden = !bad;
        if (bad) { n++; first ||= f; }
      });
      const st = $('.form__status', form);
      if (n) { st.textContent = n === 1 ? 'One field needs fixing.' : `${n} fields need fixing.`; first.focus(); return; }
      if (!freeTimes(state.house, state.date).find(([t, f]) => t === state.time && f)) { st.textContent = 'Someone just took that time. Pick another one.'; show(2); drawCal(); drawTimes(); return; }
      const all = booked(); all.push({ house: state.house, date: key(state.date), time: state.time }); localStorage.setItem('cw-bookings', JSON.stringify(all));
      $('[data-done-list]').innerHTML = [['House', state.name], ['Day', fmtDay(state.date)], ['Time', `${state.time}, one hour`], ['Name', form.name.value], ['People', (form.querySelector('input[name="people"]:checked') || {}).value || '2']].map(([a, b]) => `<div><dt>${a}</dt><dd>${b.replace(/</g, '&lt;')}</dd></div>`).join('');
      st.textContent = '';
      show('done');
    });
    $('[data-again]').addEventListener('click', () => {
      form.reset(); radios.forEach((r) => { r.checked = false; });
      Object.assign(state, { house: null, name: '', date: null, time: null });
      $('[data-next]', s1).disabled = true; next2.disabled = true; sum(); show(1);
    });
  }

  /* ---------- the WhatsApp demo chat ---------- */
  const wa = $('#wa-chat');
  const fab = $('.wa-fab');
  const body = $('[data-wa-body]', wa);
  const status = $('[data-wa-status]', wa);
  const time = () => new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const scrollDown = () => { body.scrollTop = body.scrollHeight; };
  const say = (who, html) => { const m = document.createElement('div'); m.className = `msg msg--${who}`; m.innerHTML = `${html}<time>${time()}</time>`; body.appendChild(m); scrollDown(); };
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));
  let queue = Promise.resolve();
  const bot = (html, think = 1100) => {
    queue = queue.then(async () => {
      const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>';
      status.textContent = 'typing…'; body.appendChild(t); scrollDown();
      await wait(think);
      t.remove(); status.textContent = 'AI assistant · online';
      say('in', html);
    });
    return queue;
  };
  const me = (text, delay = 900) => { queue = queue.then(async () => { await wait(delay); say('out', esc(text)); }); return queue; };
  const houseCard = (name, img, line, href) => `<a class="msg__card" href="${href}"><img src="https://images.unsplash.com/photo-${img}?w=500&h=240&q=70&auto=format&fit=crop" alt=""><span><b>${name}</b>${line}</span></a>`;
  const cavendish = houseCard('Cavendish Close, Constantia', '1613977257363-707ba9348227', '5 bed · 4 bath · 307 m² · R7,850,000', 'cavendish-close.html');

  const replies = [
    [/pool|swim/i, () => `Plenty of our homes have one. Cavendish Close in Constantia is a favourite: a north-facing pool terrace with a covered braai and outdoor kitchen. ${cavendish}Want me to hold a viewing, or show you the others with pools?`],
    [/sunday|saturday|friday|thursday|weekend|when|time|view/i, () => 'Viewings run Thursday to Sunday. You can see every free time live and book in three steps here: <a href="book.html">book a viewing</a>. Or tell me the house and day and I\'ll hold it for you.'],
    [/negotia|offer|price|cheaper|discount/i, () => "I can't agree a price myself, but the sellers do consider offers. Tom handles offers in person after a viewing, usually within 48 hours. Shall I book you in first?"],
    [/person|human|agent|call|speak|talk/i, () => 'Of course. Tom from the office will message you here within the hour, or call 021 555 0142 now (Thu–Sun 09:00–18:00).'],
    [/bed|room|big|large|family/i, () => 'We have homes from 2 to 6 bedrooms, from Sea Point apartments to Bishopscourt family houses. You can filter by bedrooms here: <a href="listings.html">see the listings</a>. How many bedrooms do you need?'],
    [/atlantic|camps bay|hout bay|sea point|llandudno|noordhoek/i, () => 'Our Atlantic Seaboard homes run from Sea Point apartments to a Llandudno villa. Daniel covers that side: <a href="listings.html?area=Atlantic%20Seaboard">see them here</a>.'],
    [/southern|constantia|bishopscourt|newlands|rondebosch|tokai|bergvliet/i, () => 'In the Southern Suburbs we have family homes from Rondebosch to Constantia. Lerato covers them: <a href="listings.html?area=Southern%20Suburbs">see them here</a>.'],
    [/northern|durbanville|bloubergstrand|blouberg|milnerton|welgemoed|plattekloof/i, () => 'Our Northern Suburbs homes are from Bloubergstrand to Durbanville. Ayesha covers them: <a href="listings.html?area=Northern%20Suburbs">see them here</a>.'],
    [/helderberg|somerset|stellenbosch|gordon/i, () => 'In the Helderberg we have homes in Somerset West, Stellenbosch and Gordon\'s Bay. Sipho covers them: <a href="listings.html?area=Helderberg">see them here</a>.'],
    [/linden|mill|cavendish|quarry/i, (m) => `${m[0][0].toUpperCase() + m[0].slice(1).toLowerCase()} is available. Every photo, the details and the features are on its page, and I can hold a viewing for you right here.`],
    [/hi|hello|hey|morning|afternoon|howzit/i, () => 'Hi! 👋 Ask me about any of our homes, or tell me a day and I\'ll find you a viewing time.'],
    [/thank|great|perfect|cool|ok|sharp/i, () => "You're welcome! Anything else, just message me here. 😊"],
  ];
  const answer = (text) => {
    for (const [re, fn] of replies) { const m = text.match(re); if (m) return fn(m); }
    return "Good question! I'll pass that to Tom in the office and he'll reply here shortly. Meanwhile, I can find you a viewing time or tell you about any of our homes.";
  };

  let played = false;
  const playDemo = () => {
    played = true;
    bot('Hi 👋 I\'m the Calder &amp; Wynn assistant. I can answer questions about our homes and book you a viewing, any time of day.', 700);
    me('Hi, is Cavendish Close still available?', 1200);
    bot(`Yes, it is! ${cavendish}It has five bedrooms, a pool terrace and an outdoor kitchen.`, 1500);
    me('Can we see it this Saturday?', 1400);
    bot('Saturday has three free slots at Cavendish Close: 09:30, 11:00 or 13:30. Which suits you?', 1300);
    me('11:00 please, there will be 4 of us', 1500);
    bot('Done ✅ Saturday 11:00 at Cavendish Close is held for you and your family. You\'ll have the house to yourselves for the hour, and Tom will meet you at the door.\n\nWant a reminder the evening before?', 1700);
    me('Yes please', 1200);
    bot('Reminder set for Friday at 18:00 👍 See you on Saturday! You can ask me anything else here.', 1100);
  };

  const setChat = (open) => {
    wa.classList.toggle('is-open', open);
    fab.setAttribute('aria-expanded', String(open));
    fab.classList.add('is-read');
    if (open && !played) playDemo();
    if (open && matchMedia('(hover: hover) and (pointer: fine)').matches) setTimeout(() => $('input', wa).focus({ preventScroll: true }), 400);
  };
  $$('[data-wa-open]').forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); setChat(!wa.classList.contains('is-open')); }));
  $('[data-wa-close]', wa).addEventListener('click', () => { setChat(false); fab.focus(); });

  /* the WhatsApp button can be held and dragged anywhere up or down either edge; on release it
     snaps to the nearer side and remembers the spot (this browser only). A plain tap still opens the chat. */
  (() => {
    const KEY = 'cw-fab-spot';
    const EDGE = 14;
    let drag = null; let justDragged = false; let holdTimer = 0;
    const bounds = () => {
      const s = fab.offsetWidth; const navH = 84;
      const dockH = innerWidth < 640 ? 96 : 24;
      return { s, minY: navH, maxY: Math.max(navH, innerHeight - dockH - s) };
    };
    const put = (x, y) => { fab.style.translate = `${Math.round(x)}px ${Math.round(y)}px`; };
    const apply = (spot, instant) => {
      if (!spot) return;
      if (instant) fab.style.transition = 'none'; // no glide across the screen on load or resize
      const { s, minY, maxY } = bounds();
      const y = Math.min(maxY, Math.max(minY, spot.y * innerHeight));
      fab.classList.add('is-moved');
      document.body.classList.toggle('fab-left', spot.side === 'left');
      put(spot.side === 'left' ? EDGE : innerWidth - s - EDGE, y);
      if (instant) { void fab.offsetWidth; fab.style.transition = ''; }
    };
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { /* private mode: no memory, still draggable */ }
    apply(saved, true);
    addEventListener('resize', () => apply(saved, true));

    const start = (e) => {
      const r = fab.getBoundingClientRect();
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moving: false };
      holdTimer = setTimeout(() => { if (drag) begin(); }, 280); // holding still also picks it up
    };
    const begin = () => {
      drag.moving = true;
      try { fab.setPointerCapture(drag.id); } catch { /* not a live pointer: dragging still works while over the button */ }
      fab.classList.add('is-moved', 'is-dragging');
      navigator.vibrate?.(8);
    };
    fab.addEventListener('pointerdown', (e) => { if (e.button === 0) start(e); });
    fab.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moving && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 6) { clearTimeout(holdTimer); begin(); }
      if (!drag.moving) return;
      e.preventDefault();
      const { s } = bounds();
      put(Math.min(innerWidth - s, Math.max(0, e.clientX - drag.dx)), Math.min(innerHeight - s, Math.max(0, e.clientY - drag.dy)));
    });
    const end = (e) => {
      clearTimeout(holdTimer);
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const moved = drag.moving; drag = null;
      fab.classList.remove('is-dragging');
      if (!moved) return;
      justDragged = true; setTimeout(() => { justDragged = false; }, 50);
      const r = fab.getBoundingClientRect();
      saved = { side: r.left + r.width / 2 < innerWidth / 2 ? 'left' : 'right', y: r.top / innerHeight };
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* ignore */ }
      apply(saved);
    };
    fab.addEventListener('pointerup', end);
    fab.addEventListener('pointercancel', end);
    // a drag must not count as a tap
    fab.addEventListener('click', (e) => { if (justDragged) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  })();
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && wa.classList.contains('is-open')) setChat(false); });
  const send = (text) => { if (!text.trim()) return; me(text, 0); bot(answer(text), 1200); };
  $('[data-wa-form]', wa).addEventListener('submit', (e) => { e.preventDefault(); const i = $('input', wa); send(i.value); i.value = ''; });
  $$('[data-wa-quick] button', wa).forEach((b) => b.addEventListener('click', () => send(b.textContent)));

  /* ---------- listing page ---------- */
  const about = $('[data-about]');
  if (about) $('[data-more]', about).addEventListener('click', (e) => {
    const open = about.classList.toggle('is-short') === false;
    e.currentTarget.textContent = open ? 'Show less' : 'Read the full description';
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });

  const lb = $('#lightbox');
  if (lb) {
    const track = $('[data-lb-track]', lb);
    const figs = $$('figure', track);
    const thumbs = $$('[data-lb-thumb]', lb);
    const count = $('[data-lb-count]', lb);
    const tabs = $('[data-lb-tabs]', lb);
    const rooms = ['All', ...new Set(figs.map((f) => f.dataset.room))];
    tabs.innerHTML = rooms.map((r, i) => `<button type="button" aria-pressed="${i === 0}" data-room-tab="${r}">${r}${r === 'All' ? ` (${figs.length})` : ''}</button>`).join('');
    let cur = 0;
    const go = (i, smooth = true) => {
      cur = Math.max(0, Math.min(figs.length - 1, i));
      track.scrollTo({ left: figs[cur].offsetLeft, behavior: smooth && !reduced ? 'smooth' : 'auto' });
    };
    const mark = () => {
      cur = Math.round(track.scrollLeft / track.clientWidth);
      count.textContent = `${cur + 1} / ${figs.length}`;
      thumbs.forEach((t, i) => t.setAttribute('aria-current', String(i === cur)));
      thumbs[cur]?.scrollIntoView({ block: 'nearest', inline: 'center' });
      const room = figs[cur].dataset.room;
      $$('[data-room-tab]', tabs).forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.roomTab === room)));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    const open = (i) => { lb.classList.add('is-open'); lock(true); requestAnimationFrame(() => { go(i, false); mark(); $('[data-lb-close]', lb).focus(); }); };
    const close = () => { lb.classList.remove('is-open'); lock(false); };
    $$('[data-open-photo]').forEach((b) => b.addEventListener('click', () => open(+b.dataset.openPhoto)));
    $('[data-lb-close]', lb).addEventListener('click', close);
    $('[data-lb-prev]', lb).addEventListener('click', () => go(cur - 1));
    $('[data-lb-next]', lb).addEventListener('click', () => go(cur + 1));
    thumbs.forEach((t) => t.addEventListener('click', () => go(+t.dataset.lbThumb)));
    tabs.addEventListener('click', (e) => { const r = e.target.closest('[data-room-tab]')?.dataset.roomTab; if (!r) return; go(r === 'All' ? 0 : figs.findIndex((f) => f.dataset.room === r)); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(cur + 1);
      if (e.key === 'ArrowLeft') go(cur - 1);
    });
  }

  /* ---------- dropdowns: the native select stays (hidden) and holds the value; the list is the site's own, the same on every device ---------- */
  const dds = [];
  $$('.filter select').forEach((sel, n) => {
    const wrap = sel.parentElement;
    const id = sel.id || `dd-${n}`;
    const label = $('label', wrap);
    const btn = document.createElement('button');
    const val = document.createElement('span');
    const list = document.createElement('ul');
    wrap.classList.add('dd');
    btn.type = 'button'; btn.className = 'dd__btn'; btn.id = `${id}-btn`;
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', `${id}-list`);
    if (label) { label.id = `${id}-lbl`; label.htmlFor = btn.id; btn.setAttribute('aria-labelledby', `${label.id} ${btn.id}`); list.setAttribute('aria-labelledby', label.id); }
    btn.append(val);
    list.className = 'dd__list'; list.id = `${id}-list`; list.tabIndex = -1; list.setAttribute('role', 'listbox');
    const opts = [...sel.options].map((o, i) => {
      const li = document.createElement('li');
      li.id = `${id}-o${i}`; li.setAttribute('role', 'option'); li.textContent = o.text;
      list.append(li); return li;
    });
    sel.hidden = true; sel.tabIndex = -1;
    wrap.append(btn, list);

    let active = 0, pressing = false;
    const sync = () => { val.textContent = sel.options[sel.selectedIndex]?.text || ''; opts.forEach((li, i) => li.setAttribute('aria-selected', String(i === sel.selectedIndex))); };
    const mark = (i, scroll = true) => {
      active = (i + opts.length) % opts.length;
      opts.forEach((li, j) => li.classList.toggle('is-active', j === active));
      list.setAttribute('aria-activedescendant', opts[active].id);
      if (scroll) opts[active].scrollIntoView({ block: 'nearest' });
    };
    const isOpen = () => wrap.classList.contains('is-open');
    const close = (focus) => { if (!isOpen()) return; wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); if (focus) btn.focus({ preventScroll: true }); };
    const open = () => {
      dds.forEach((c) => c !== close && c(false));
      const r = btn.getBoundingClientRect();
      const vh = window.visualViewport ? visualViewport.height : innerHeight;
      const below = vh - r.bottom, need = Math.min(list.scrollHeight, 320) + 16;
      wrap.classList.toggle('is-up', below < need && r.top > below);
      wrap.classList.remove('is-right');
      wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
      if (list.getBoundingClientRect().right > document.documentElement.clientWidth - 8) wrap.classList.add('is-right');
      mark(sel.selectedIndex);
      list.focus({ preventScroll: true });
    };
    const pick = (i) => {
      if (sel.selectedIndex !== i) { sel.selectedIndex = i; sel.dispatchEvent(new Event('change', { bubbles: true })); }
      sync(); close(true);
    };
    dds.push(close);
    btn.addEventListener('pointerdown', () => { pressing = true; setTimeout(() => { pressing = false; }, 400); });
    btn.addEventListener('click', () => (isOpen() ? close(false) : open()));
    btn.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); } });
    list.addEventListener('click', (e) => { const li = e.target.closest('[role="option"]'); if (li) pick(opts.indexOf(li)); });
    list.addEventListener('pointermove', (e) => { const li = e.target.closest('[role="option"]'); if (li && e.pointerType === 'mouse') mark(opts.indexOf(li), false); });
    list.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown') mark(active + 1);
      else if (k === 'ArrowUp') mark(active - 1);
      else if (k === 'Home') mark(0);
      else if (k === 'End') mark(opts.length - 1);
      else if (k === 'Enter' || k === ' ') pick(active);
      else if (k === 'Escape') close(true);
      else if (k === 'Tab') { close(false); return; }
      else if (k.length === 1) {
        const starts = (li) => li.textContent.toLowerCase().startsWith(k.toLowerCase());
        const next = opts.findIndex((li, i) => i > active && starts(li));
        const first = opts.findIndex(starts);
        if (next > -1 || first > -1) mark(next > -1 ? next : first);
        return;
      } else return;
      e.preventDefault();
    });
    list.addEventListener('focusout', (e) => { if (!pressing && !wrap.contains(e.relatedTarget)) close(false); });
    if (sel.form) sel.form.addEventListener('reset', () => setTimeout(sync));
    sync();
  });
  if (dds.length) {
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.dd')) dds.forEach((c) => c(false)); });
    addEventListener('resize', () => dds.forEach((c) => c(false)));
  }

  /* ---------- phone keyboard: hide the dock and the chat button while typing; the open chat fills what the keyboard leaves ---------- */
  const typeable = 'input:not([type]), input[type="text"], input[type="tel"], input[type="email"], input[type="search"], input[type="number"], textarea';
  document.addEventListener('focusin', (e) => { if (e.target.matches && e.target.matches(typeable)) document.documentElement.classList.add('is-typing'); });
  document.addEventListener('focusout', (e) => { if (e.target.matches && e.target.matches(typeable)) document.documentElement.classList.remove('is-typing'); });
  const chatPanel = $('.wa');
  const vv = window.visualViewport;
  if (chatPanel && vv) {
    const phone = matchMedia('(max-width: 639px)');
    const fit = () => {
      const el = document.activeElement;
      const typing = phone.matches && chatPanel.classList.contains('is-open') && chatPanel.contains(el) && el.matches(typeable);
      if (typing) {
        chatPanel.style.top = `${Math.round(vv.offsetTop) + 8}px`;
        chatPanel.style.bottom = 'auto';
        chatPanel.style.height = `${Math.round(vv.height) - 16}px`;
        const body = $('[data-wa-body]', chatPanel); if (body) body.scrollTop = body.scrollHeight;
      } else { chatPanel.style.top = ''; chatPanel.style.bottom = ''; chatPanel.style.height = ''; }
    };
    vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
    chatPanel.addEventListener('focusin', () => setTimeout(fit, 60));
    chatPanel.addEventListener('focusout', () => setTimeout(fit, 60));
  }

  /* ---------- logo intro (first visit per tab): the circle is drawn and the name written out in real time,
     then the dark screen fades while the logo flies to its own place in the bar ---------- */
  const intro = $('.intro');
  const root = document.documentElement;
  const navLogo = $('.nav .logo');
  if (intro && navLogo && root.classList.contains('is-intro')) {
    clearTimeout(window.__introT);
    const bg = $('.intro__bg', intro);
    // the hero film (first visit only): it loads with the page, starts as the dark screen fades, and the hero settles
    // into place around its final frame just before it ends
    const film = root.classList.contains('hero-film') ? $('[data-hero-video]') : null;
    if (!film) root.classList.remove('hero-film');
    else { film.preload = 'auto'; film.load(); }
    let settled = false;
    const settle = () => {
      if (settled) return; settled = true;
      root.classList.remove('hero-film', 'intro-hold');
      dispatchEvent(new Event('hero:settled'));
      setTimeout(() => dispatchEvent(new Event('resize')), 1500); // re-measure the cut-out once the frame is back
    };
    const endFilm = () => {
      settle();
      film.classList.remove('is-playing');
    };
    const playFilm = () => {
      film.classList.add('is-playing');
      const p = film.play();
      if (p && p.catch) p.catch(endFilm);
      const watch = () => {
        if (settled) return;
        if (film.duration && film.currentTime >= film.duration - 1) { settle(); return; }
        requestAnimationFrame(watch);
      };
      requestAnimationFrame(watch);
      film.addEventListener('ended', endFilm, { once: true });
      $('.hero').addEventListener('pointerdown', endFilm, { once: true });
      setTimeout(endFilm, 6000);
    };
    const finish = () => { root.classList.remove('is-intro'); if (!film) root.classList.remove('intro-hold'); intro.remove(); };
    // a copy of the bar's logo, keeping only what the bar shows at this screen size
    const clone = navLogo.cloneNode(true);
    const orig = [navLogo, ...navLogo.querySelectorAll('*')];
    const copy = [clone, ...clone.querySelectorAll('*')];
    orig.forEach((el, i) => { if (getComputedStyle(el).display === 'none') copy[i].remove(); });
    clone.removeAttribute('href'); clone.removeAttribute('aria-label'); clone.tabIndex = -1;
    clone.classList.add('intro__logo');
    // every letter becomes its own span, written one after another
    const split = (el, start, rate) => {
      if (!el) return start;
      let t = start;
      [...el.childNodes].forEach((node) => {
        if (node.nodeType !== 3) return;
        const frag = document.createDocumentFragment();
        [...node.textContent].forEach((ch) => {
          if (ch === ' ') { frag.append(' '); t += rate * 0.6; return; }
          const s = document.createElement('span');
          s.className = 'intro__ch'; s.textContent = ch; s.style.setProperty('--d', `${t.toFixed(3)}s`);
          frag.append(s); t += rate;
        });
        node.replaceWith(frag);
      });
      return t;
    };
    const mark = $('.logo__mark', clone);
    const ini = document.createElement('span'); ini.className = 'intro__ini'; ini.textContent = mark.textContent; mark.replaceChildren(ini);
    split(ini, 0.85, 0.12);
    mark.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19.5" pathLength="1"/></svg><i class="intro__pen"></i>');
    let end = split($('.logo__name b', clone), 1.35, 0.085);
    end = split($('.logo__name small', clone), end + 0.15, 0.04);
    intro.append(clone);

    const timers = [];
    let flying = false;
    const fly = () => {
      if (flying || !intro.classList.contains('is-drawing')) return;
      flying = true; timers.forEach(clearTimeout);
      if (!film) root.classList.remove('intro-hold');
      intro.classList.add('is-flying');
      clone.style.setProperty('--ink-c', getComputedStyle(navLogo).color);
      if (film) playFilm();
      const move = clone.animate([{ transform: clone.style.transform }, { transform: 'none' }], { duration: film ? 1400 : 1600, easing: 'cubic-bezier(.65, 0, .2, 1)', fill: 'forwards' });
      const fade = bg.animate([{ opacity: 1 }, { opacity: 0 }], film ? { duration: 900, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' } : { duration: 2000, delay: 250, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' });
      Promise.all([move.finished, fade.finished]).then(finish, finish);
      setTimeout(finish, 3000);
    };
    // the intro is also the loading screen: the logo only flies once the page has loaded (12 s at most),
    // with a hairline under the logo showing how far along it is
    const bar = document.createElement('i'); bar.className = 'intro__load'; intro.append(bar);
    let written = false, loaded = false, ready = 0;
    const assets = [...document.querySelectorAll('img:not([loading="lazy"]), video[data-hero-video]')];
    const total = assets.length + 2; // + fonts + the page's load event
    const check = () => { if (written && loaded) fly(); };
    const tick = () => { ready++; bar.style.setProperty('--p', Math.min(1, ready / total).toFixed(3)); if (ready >= total) { loaded = true; check(); } };
    assets.forEach((el) => {
      const img = el.tagName === 'IMG';
      if (img ? el.complete : el.readyState >= 3) { tick(); return; }
      let once = false; const f = () => { if (!once) { once = true; tick(); } };
      el.addEventListener(img ? 'load' : 'canplaythrough', f); el.addEventListener('error', f);
    });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(tick);
    if (document.readyState === 'complete') tick(); else addEventListener('load', tick, { once: true });
    setTimeout(() => { loaded = true; check(); }, 12000);
    const start = () => {
      const r = navLogo.getBoundingClientRect();
      clone.style.left = `${r.left}px`; clone.style.top = `${r.top}px`;
      const w = clone.getBoundingClientRect().width || r.width, h = r.height;
      const k = Math.min(innerWidth < 640 ? 2 : 2.7, (innerWidth * 0.84) / w);
      clone.style.transform = `translate(${(innerWidth - w * k) / 2 - r.left}px, ${(innerHeight - h * k) / 2 - r.top}px) scale(${k})`;
      intro.classList.add('is-drawing');
      timers.push(setTimeout(() => { written = true; check(); }, (end + 0.9) * 1000));
    };
    intro.addEventListener('pointerdown', fly);
    addEventListener('keydown', fly, { once: true });
    Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1200))])
      .then(() => requestAnimationFrame(start));
  }


  /* ---------- the chat button's mascot waves now and then, with an "Ask me anything!" bubble ---------- */
  const mascot = $('.wa-fab');
  if (mascot && $('.mascot', mascot)) {
    const busy = () => document.hidden || mascot.getAttribute('aria-expanded') === 'true' || mascot.classList.contains('is-dragging')
      || document.documentElement.classList.contains('is-intro') || document.documentElement.classList.contains('hero-film')
      || document.body.classList.contains('menu-open') || document.documentElement.classList.contains('is-typing');
    let waveT;
    const wave = () => {
      if (busy() || mascot.classList.contains('is-waving')) return false;
      mascot.classList.add('is-waving');
      clearTimeout(waveT); waveT = setTimeout(() => mascot.classList.remove('is-waving'), 3600);
      return true;
    };
    const first = () => { if (!wave()) setTimeout(first, 1000); };
    setTimeout(first, 2200);
    setInterval(wave, 15000);
    mascot.addEventListener('mouseenter', wave);
    mascot.addEventListener('click', () => { mascot.classList.remove('is-waving'); clearTimeout(waveT); });
  }

  /* office map: a saved screenshot until the visitor taps it. The tap is their consent: the live Google map loads
     (Google then gets their IP and may set cookies) and the choice is remembered until they turn it off below the map. */
  const MAPS = 'cw-maps';
  const mapsOk = () => { try { return localStorage.getItem(MAPS) === '1'; } catch { return false; } };
  const liveMap = (box, focus) => {
    const f = document.createElement('iframe');
    f.title = box.dataset.mapTitle;
    f.src = box.dataset.mapSrc;
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.allowFullscreen = true;
    box.replaceChildren(f);
    const note = box.parentElement.querySelector('[data-map-note]');
    if (note) {
      note.textContent = 'The live map is on, so some information is shared with Google. ';
      const off = document.createElement('button');
      off.type = 'button'; off.textContent = 'Turn it off';
      off.addEventListener('click', () => { try { localStorage.setItem(MAPS, '0'); } catch { /* ignore */ } location.reload(); });
      note.append(off);
    }
    if (focus) f.focus();
  };
  $$('[data-map-src]').forEach((box) => {
    if (mapsOk()) { liveMap(box, false); return; }
    const btn = box.querySelector('[data-map-load]');
    if (btn) btn.addEventListener('click', () => { try { localStorage.setItem(MAPS, '1'); } catch { /* private mode: loads this time only */ } liveMap(box, true); });
  });
})();
