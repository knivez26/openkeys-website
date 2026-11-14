/* OpenKeys motion layer. Progressive enhancement: the page works without it. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const narrow = matchMedia('(max-width: 760px)');
  root.classList.add('js-motion');

  /* Reveal: re-run for any .reveal the base script already handled or missed. */
  const reveals = [...document.querySelectorAll('.reveal:not(.visible)')];
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px' });
    reveals.forEach(el => io.observe(el));
  } else reveals.forEach(el => el.classList.add('visible'));

  /* Split hero headline into masked lines. */
  const h1 = document.querySelector('.hero h1');
  if (h1 && !reduce.matches) {
    const lines = h1.innerHTML.split(/<br\s*\/?>/i);
    h1.innerHTML = lines.map(l => `<span class="split-line"><span>${l.trim()}</span></span>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() => h1.classList.add('split-ready')));
  }

  /* Pointer parallax for [data-tilt] stages. */
  const stages = [...document.querySelectorAll('[data-tilt]')];
  stages.forEach(stage => {
    const layers = [...stage.querySelectorAll('[data-depth]')];
    layers.forEach(l => l.style.setProperty('--d', l.dataset.depth));
    const target = stage.querySelector('.hero-stack') || stage;
    if (!fine.matches || reduce.matches) return;
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      target.style.setProperty('--ry', `${-8 + x * 10}deg`);
      target.style.setProperty('--rx', `${4 - y * 8}deg`);
      layers.forEach(l => {
        const d = +l.dataset.depth / 100;
        l.style.setProperty('--px', `${x * d * 60}px`);
        l.style.setProperty('--py', `${y * d * 60}px`);
        if (!stage.classList.contains('hero-visual')) {
          l.style.setProperty('--ry', `${-10 + x * 12}deg`);
          l.style.setProperty('--rx', `${4 - y * 8}deg`);
        }
      });
    });
    stage.addEventListener('pointerleave', () => {
      ['--ry', '--rx'].forEach(p => target.style.removeProperty(p));
      layers.forEach(l => ['--px', '--py', '--ry', '--rx'].forEach(p => l.style.removeProperty(p)));
    });
  });

  /* Spotlight that follows the cursor on feature cards. */
  if (fine.matches) document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* Theme stage: iPad and iPhone show opposite themes; switch or auto-cycle. */
  document.querySelectorAll('[data-theme-stage]').forEach(stage => {
    const wrap = stage.parentElement;
    const buttons = [...wrap.querySelectorAll('[data-set-theme]')];
    const themes = buttons.map(b => b.dataset.setTheme);
    let current = themes[0], timer = null;
    const apply = theme => {
      current = theme;
      wrap.dataset.activeTheme = theme;
      const other = themes.find(t => t !== theme) || theme;
      const [ipad, phone] = stage.querySelectorAll('.device-screen');
      ipad?.querySelectorAll('img').forEach(img => img.classList.toggle('active', img.dataset.theme === theme));
      phone?.querySelectorAll('img').forEach(img => img.classList.toggle('active', img.dataset.theme === other));
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setTheme === theme)));
    };
    const cycle = () => { if (!document.hidden) apply(themes[(themes.indexOf(current) + 1) % themes.length]); };
    buttons.forEach(b => b.addEventListener('click', () => { clearInterval(timer); timer = null; apply(b.dataset.setTheme); }));
    apply(current);
    if (!reduce.matches && themes.length > 1) timer = setInterval(cycle, 4500);
  });

  /* Crossfading device screens. */
  if (!reduce.matches) document.querySelectorAll('[data-cycle]').forEach((screen, n) => {
    const imgs = [...screen.querySelectorAll('img')];
    if (imgs.length < 2) return;
    let i = 0;
    setTimeout(() => setInterval(() => {
      if (document.hidden) return;
      imgs[i].classList.remove('active');
      i = (i + 1) % imgs.length;
      imgs[i].classList.add('active');
    }, 4200), n * 1400);
  });

  /* Scroll-driven: progress bar, pinned tour, parallax cards, marquee speed. */
  const tour = document.querySelector('.tour');
  const track = tour?.querySelector('.tour-track');
  const slides = tour ? [...tour.querySelectorAll('.tour-slide')] : [];
  const cards = [...document.querySelectorAll('.screen-card img')];
  const marquee = document.querySelector('.marquee');
  const SCROLL_RATIO = .55; /* px of page scroll per px of sideways travel */
  let distance = 0, lastY = scrollY, velocity = 0, ticking = false;

  const pinned = () => tour && !narrow.matches && !reduce.matches;
  const measure = () => {
    if (!pinned()) { tour?.style.removeProperty('--tour-distance'); track?.style.removeProperty('--tx'); return; }
    distance = Math.max(0, track.scrollWidth - innerWidth);
    tour.style.setProperty('--tour-distance', `${Math.round(distance * SCROLL_RATIO)}px`);
  };

  const frame = () => {
    ticking = false;
    const y = scrollY, max = root.scrollHeight - innerHeight;
    root.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    if (pinned()) {
      const top = tour.offsetTop, p = Math.min(1, Math.max(0, (y - top) / ((distance * SCROLL_RATIO) || 1)));
      track.style.setProperty('--tx', `${-p * distance}px`);
      tour.style.setProperty('--tour', p.toFixed(4));
      const active = Math.round(p * (slides.length - 1));
      slides.forEach((s, i) => s.classList.toggle('is-active', i === active));
    } else slides.forEach(s => s.classList.add('is-active'));

    if (!reduce.matches) {
      cards.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.setProperty('--par', `${(c * -40).toFixed(1)}px`);
      });
      velocity = velocity * .85 + Math.abs(y - lastY) * .15;
      marquee?.style.setProperty('--marquee-speed', `${Math.max(8, 26 - velocity * .6).toFixed(1)}s`);
    }
    lastY = y;
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { measure(); request(); });
  narrow.addEventListener?.('change', () => { measure(); request(); });
  addEventListener('load', () => { measure(); request(); });
  measure(); frame();

  /* Count-up for big numbers when they enter view. */
  const counters = [...document.querySelectorAll('.collection-count strong, .stage-display > strong')]
    .filter(el => /^\d+$/.test(el.textContent.trim()));
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      const el = e.target, end = +el.textContent.trim(), t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    counters.forEach(el => co.observe(el));
  }
})();
