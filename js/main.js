(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!window.gsap;
  if (!hasGsap) document.documentElement.classList.remove('js');

  /* top nav bar (live ph.747.live header): "Tournaments" only opens its menu, the theme switch flips, search needs a query */
  (function(){
    var lh = document.getElementById('lh');
    if (!lh) return;
    lh.querySelectorAll('.lh__link[href="#"]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); }); });
    var theme = lh.querySelector('.lh__theme');
    theme.addEventListener('click', function(){
      var dark = theme.getAttribute('aria-pressed') !== 'true';
      theme.setAttribute('aria-pressed', dark);
      theme.setAttribute('aria-label', dark ? 'Dark mode' : 'Light mode');
    });
    var form = lh.querySelector('.lh__search');
    form.addEventListener('submit', function(e){ if (!form.search.value.trim()) e.preventDefault(); });
  })();

  /* ---------- split section titles into masked lines of words ---------- */
  $$('.title.split').forEach(el => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(line => {
      const tmp = document.createElement('div');
      tmp.innerHTML = line.trim();
      return [...tmp.childNodes].map(n => {
        if (n.nodeType === 3) return n.textContent.split(/\s+/).filter(Boolean).map(w => `<span class="wl"><span>${w}</span></span>`).join(' ');
        return `<span class="wl"><span>${n.outerHTML}</span></span>`;
      }).join(' ');
    }).join('<br>');
  });

  /* ---------- month strip (qualify step 3) ---------- */
  const days = $('.month__days');
  if (days) {
    const step = 10.3, signUp = 3, dep = 20;
    let html = '';
    for (let i = 0; i < 30; i++) {
      const on = i === signUp || i === dep;
      html += `<rect class="${on ? 'on' : ''}" x="${(i * step).toFixed(1)}" y="${on ? 24 : 28}" width="7" height="${on ? 20 : 12}" rx="2"/>`;
    }
    days.innerHTML = html;
    const cx = i => i * step + 3.5;
    $('.month__arc').setAttribute('d', `M${cx(signUp)} 20 C ${cx(signUp) + 40} -6, ${cx(dep) - 40} -6, ${cx(dep)} 20`);
    const t = $$('.month text');
    t[0].setAttribute('x', cx(signUp)); t[1].setAttribute('x', cx(dep));
  }

  /* ---------- 3D coin in the hero pill ---------- */
  const coinCanvas = $('#coin');
  let coin, coinRenderer, coinScene, coinCam;
  if (window.THREE && coinCanvas) {
    const T = THREE;
    coinRenderer = new T.WebGLRenderer({ canvas: coinCanvas, antialias: true, alpha: true });
    coinRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    coinScene = new T.Scene();
    coinCam = new T.PerspectiveCamera(30, 1, 0.1, 50);
    coinCam.position.set(0, 0, 4.6);

    const face = () => {
      const c = document.createElement('canvas'); c.width = c.height = 512;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(200, 180, 40, 256, 256, 260);
      grd.addColorStop(0, '#2a8a52'); grd.addColorStop(1, '#0b3b22');
      g.fillStyle = grd; g.beginPath(); g.arc(256, 256, 256, 0, 7); g.fill();
      g.strokeStyle = '#e8c35a'; g.lineWidth = 26; g.beginPath(); g.arc(256, 256, 226, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(232,195,90,.45)'; g.lineWidth = 4; g.setLineDash([10, 12]); g.beginPath(); g.arc(256, 256, 196, 0, 7); g.stroke();
      // peso sign drawn by hand so it never depends on font glyph coverage
      g.setLineDash([]); g.fillStyle = g.strokeStyle = '#f3d37a';
      g.fillRect(190, 140, 44, 240);
      g.lineWidth = 42; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(212, 161); g.lineTo(270, 161); g.arc(270, 222, 61, -Math.PI / 2, Math.PI / 2); g.lineTo(212, 283); g.stroke();
      g.fillRect(150, 196, 240, 17); g.fillRect(150, 232, 240, 17);
      const tex = new T.CanvasTexture(c); tex.anisotropy = 4; return tex;
    };
    const faceTex = face();
    const gold = new T.MeshStandardMaterial({ color: 0xd9a93a, metalness: 0.75, roughness: 0.28 });
    const faceMat = new T.MeshStandardMaterial({ map: faceTex, metalness: 0.35, roughness: 0.35 });
    // gold rim as a cylinder, faces as discs so the texture stays upright
    const rimMesh = new T.Mesh(new T.CylinderGeometry(1, 1, 0.2, 72, 1, true), gold);
    rimMesh.rotation.x = Math.PI / 2;
    const front = new T.Mesh(new T.CircleGeometry(1, 72), faceMat); front.position.z = 0.1;
    const back = new T.Mesh(new T.CircleGeometry(1, 72), faceMat); back.position.z = -0.1; back.rotation.y = Math.PI;
    const group = new T.Group(); group.add(rimMesh, front, back); coinScene.add(group); coin = group;

    coinScene.add(new T.HemisphereLight(0xeaffef, 0x0b2a18, 1.1));
    const key = new T.DirectionalLight(0xffffff, 1.4); key.position.set(3, 4, 5); coinScene.add(key);
    const rim = new T.PointLight(0xb6f23a, 2.2, 12); rim.position.set(-3, -1, 2); coinScene.add(rim);

    const fit = () => {
      const r = coinCanvas.parentElement.getBoundingClientRect();
      coinRenderer.setSize(r.width, r.height, false);
      coinCam.aspect = r.width / r.height; coinCam.updateProjectionMatrix();
    };
    fit(); addEventListener('resize', fit);
    document.fonts && document.fonts.ready.then(() => { faceMat.map = face(); faceMat.needsUpdate = true; });

    let spin = 0, boost = 0;
    const tick = () => {
      spin += 0.018 + boost; boost *= 0.92;
      coin.rotation.y = spin;
      coin.rotation.x = Math.sin(spin * 0.6) * 0.18;
      coinRenderer.render(coinScene, coinCam);
      requestAnimationFrame(tick);
    };
    reduce ? coinRenderer.render(coinScene, coinCam) : tick();
    window.__coinBoost = v => { boost = Math.min(boost + v, 0.25); };
  }

  /* ---------- claim flow phone ---------- */
  const screens = $$('.scr'), steps = $$('.steps li'), dots = $$('.dots button');
  const ripple = $('.ripple'), screenBox = $('.phone__screen');
  const DUR = 3200;
  let cur = 0, timer = null, inView = false;
  const go = i => {
    if (i === cur && screens[i].classList.contains('is-on')) return;
    screens.forEach((s, k) => { s.classList.toggle('is-on', k === i); s.classList.toggle('is-out', k === cur && k !== i); });
    steps.forEach((s, k) => s.classList.toggle('is-on', k === i));
    const cap = $('.claim__cap'), li = steps[i];
    if (cap && li) {
      $('.claim__num', cap).innerHTML = `0${i + 1}<small>/04</small>`;
      $('b', cap).textContent = $('b', li).textContent;
      $(':scope > div small', cap).textContent = $('small', li).textContent;
      cap.classList.remove('swap'); void cap.offsetWidth; cap.classList.add('swap');
    }
    dots.forEach((d, k) => { d.classList.remove('is-on'); if (k === i) { void d.offsetWidth; d.classList.add('is-on'); } });
    cur = i;
    if (i === 3 && hasGsap) {
      const n = $('.plus span'), o = { v: 0 };
      gsap.to(o, { v: 50, duration: 1, delay: .5, ease: 'power3.out', onUpdate: () => n.textContent = Math.round(o.v) });
    }
    // tap ripple on the thing to press
    const target = $('.tapme', screens[i]);
    if (target) setTimeout(() => {
      const a = target.getBoundingClientRect(), b = screenBox.getBoundingClientRect();
      ripple.style.left = (a.left - b.left + a.width / 2) + 'px';
      ripple.style.top = (a.top - b.top + a.height / 2) + 'px';
      ripple.classList.remove('go'); void ripple.offsetWidth; ripple.classList.add('go');
    }, DUR - 900);
  };
  const play = () => { clearInterval(timer); if (inView && !reduce) timer = setInterval(() => go((cur + 1) % 4), DUR); };
  document.documentElement.style.setProperty('--dur', DUR + 'ms');
  [...steps, ...dots].forEach((el, k) => el.addEventListener('click', () => { go(k % 4); play(); }));
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) { go(cur); play(); } else clearInterval(timer); }, { threshold: .35 }).observe($('.claim__stage'));
  screens[0].classList.remove('is-on'); go(0);

  /* ---------- support chat preview plays once in view ---------- */
  const chat = $('.chatmock');
  if (chat) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { chat.classList.add('in'); o.disconnect(); } }, { threshold: .4 }).observe(chat);

  /* ---------- bars + counters ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    if (el.classList.contains('bars')) el.classList.add('in');
    if (el.classList.contains('count')) {
      const to = +el.dataset.to;
      if (!hasGsap || reduce) { el.textContent = to; return; }
      const o = { v: 0 }; gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) });
    }
  }), { threshold: .4 });
  $$('.bars, .count').forEach(el => io.observe(el));

  /* ---------- terms card (expandable) ---------- */
  const tc = $('.tc'), tcBtn = $('.tc__btn'), tcBody = $('.tc__body');
  const tcLabel = $('span', tcBtn);
  const refresh = () => window.__st && ScrollTrigger.refresh();
  tcBtn.addEventListener('click', () => {
    const open = tcBtn.getAttribute('aria-expanded') !== 'true';
    tcBtn.setAttribute('aria-expanded', open);
    tc.classList.toggle('is-open', open);
    tcLabel.textContent = open ? 'Hide the terms' : 'Read the terms';
    if (!hasGsap || reduce) { tcBody.hidden = !open; $('.rule__bars', tcBody).classList.add('in'); refresh(); return; }
    if (open) {
      tcBody.hidden = false;
      gsap.fromTo(tcBody, { height: 0 }, { height: 'auto', duration: .6, ease: 'power3.out', onComplete: refresh });
      gsap.fromTo($$('.rule, .tc__foot', tcBody), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: .06, duration: .6, delay: .1, ease: 'power3.out' });
      const bars = $('.rule__bars', tcBody); bars.classList.remove('in'); setTimeout(() => bars.classList.add('in'), 250);
      const ring = $('.ring__fill', tcBody);
      if (ring) gsap.fromTo(ring, { strokeDashoffset: 176 }, { strokeDashoffset: 0, duration: 1.4, delay: .3, ease: 'power3.out' });
    } else {
      gsap.to(tcBody, { height: 0, duration: .45, ease: 'power2.inOut', onComplete: () => { tcBody.hidden = true; tcBody.style.height = ''; refresh(); } });
    }
  });

  if (!hasGsap || reduce) return;

  /* ================= GSAP motion ================= */
  gsap.registerPlugin(ScrollTrigger);
  window.__st = true;
  let marqueeVel = 0;

  // smooth scroll
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', e => {
      ScrollTrigger.update();
      window.__coinBoost && window.__coinBoost(Math.abs(e.velocity) * 0.002);
      marqueeVel = e.velocity;
    });
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // banner intro + parallax
  const mq = gsap.matchMedia();
  const bannerIn = sel => {
    const f = $(sel);
    gsap.from($('.banner__bg', f), { scale: 1.12, duration: 1.8, ease: 'power3.out' });
    gsap.from($('.banner__head', f), { y: 40, opacity: 0, scale: .94, duration: 1.2, delay: .25, ease: 'back.out(1.6)' });
    gsap.to($('.banner__head', f), { y: -10, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 });
    gsap.to($('.banner__bg', f), { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '.banner', start: 'top top', end: 'bottom top', scrub: true } });
  };
  mq.add('(max-width: 767px)', () => {
    bannerIn('.banner__frame--m');
    gsap.from('.bm__rg, .bm__logos, .bm__users', { y: -14, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out' });
    gsap.from('.bm__podium', { scaleX: .3, opacity: 0, duration: 1, delay: .3, ease: 'power3.out' });
    gsap.from('.bm__mascot', { yPercent: 40, opacity: 0, duration: 1.2, delay: .5, ease: 'back.out(1.4)' });
    gsap.to('.bm__mascot', { rotate: 2.5, duration: 1.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.7 });
    gsap.from('.bm__cashin', { scale: 0, rotate: -12, duration: .9, delay: 1, ease: 'back.out(2)' });
    gsap.to('.bm__cashin', { scale: 1.06, duration: .9, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 2 });
  });
  mq.add('(min-width: 768px)', () => {
    bannerIn('.banner__frame--d');
    const f = $('.banner__frame--d'), head = $('.banner__head', f);
    const xTo = gsap.quickTo(head, 'x', { duration: .8, ease: 'power3' });
    f.addEventListener('mousemove', e => { const r = f.getBoundingClientRect(); xTo(((e.clientX - r.left) / r.width - .5) * -24); });
  });

  // giant hero words
  gsap.to('.hero .mega .w', { y: 0, duration: 1.1, ease: 'power4.out', stagger: .08, scrollTrigger: { trigger: '.hero', start: 'top 85%' } });
  gsap.from('.pill', { scale: 0, duration: .9, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.hero', start: 'top 70%' } });
  gsap.to('.app .mega .w', { y: 0, duration: 1.1, ease: 'power4.out', stagger: .08, scrollTrigger: { trigger: '.app', start: 'top 75%' } });

  // marker highlights swipe in behind key words
  $$('.hl').forEach(el => {
    const onLime = !!el.closest('.app__panel, .support');
    gsap.fromTo(el, { backgroundSize: '0% 100%', color: onLime ? '#04140c' : '#e9f4ec' },
      { backgroundSize: '100% 100%', color: onLime ? '#c4ff3d' : '#04140c', duration: .7, delay: .55, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // section titles
  $$('.title.split').forEach(t => gsap.to($$('.wl > span', t), { y: 0, duration: 1, ease: 'power4.out', stagger: .06, scrollTrigger: { trigger: t, start: 'top 85%' } }));

  // generic reveals
  $$('.reveal').forEach(el => gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));

  // stacking cards: earlier cards sink back as the next one arrives
  const cards = $$('.card');
  const stacked = () => getComputedStyle(cards[0]).position === 'sticky';
  cards.forEach((c, i) => {
    const next = cards[i + 1];
    if (next && stacked()) gsap.to(c, { scale: .92, '--sink': .5, ease: 'none', scrollTrigger: { trigger: next, start: 'top 95%', end: 'top 30%', scrub: true } });
    gsap.from($('.card__art', c), { rotate: -10, scale: .8, opacity: 0, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 75%' } });
  });

  // bento tiles
  gsap.from('.tile', { y: 50, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, scrollTrigger: { trigger: '.bento', start: 'top 80%' } });

  // idle float on 3D renders
  $$('.float').forEach((el, i) => gsap.to(el, { y: i % 2 ? 12 : -12, rotate: i % 2 ? 2 : -2, duration: 3 + (i % 3) * .6, ease: 'sine.inOut', yoyo: true, repeat: -1 }));

  // marquee, nudged by scroll velocity
  const track = $('.marquee__track');
  const loop = gsap.to(track, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
  gsap.ticker.add(() => {
    const target = 1 + Math.min(Math.abs(marqueeVel) * .15, 4);
    loop.timeScale(gsap.utils.interpolate(loop.timeScale(), target, .08));
    marqueeVel *= .9;
  });

  // hero decoration drifts at different depths
  const heroScrub = { trigger: '.hero', start: 'top bottom', end: 'bottom top', scrub: true };
  gsap.to('.deco--ribbon', { yPercent: -18, rotate: 6, ease: 'none', scrollTrigger: heroScrub });
  gsap.to('.deco--c1', { y: -140, rotate: 40, ease: 'none', scrollTrigger: { ...heroScrub } });
  gsap.to('.deco--c2', { y: -60, rotate: -70, ease: 'none', scrollTrigger: { ...heroScrub } });
  gsap.from('.deco', { scale: .4, opacity: 0, duration: 1.4, ease: 'back.out(1.6)', stagger: .12, delay: .3 });

  // app panel pieces
  gsap.from('.app__art', { y: 80, rotate: 6, opacity: 0, duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '.app__panel', start: 'top 70%' } });
  gsap.to('.app__coin--1', { y: -26, rotate: -30, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.app__coin--2', { y: 20, rotate: 40, duration: 2.7, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.from('.support', { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.support', start: 'top 90%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
