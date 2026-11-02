(() => {
  const section = document.querySelector('#signature-collections');
  if (!section) return;
  const chapters = [...section.querySelectorAll('[data-collection]')];
  const players = chapters.map(chapter => chapter.querySelector('[data-preview]'));
  let playRequest = 0;
  const time = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '--:--';

  chapters.forEach(chapter => {
    const name = chapter.dataset.collection === 'darchrow' ? 'Darchrow' : 'Zero';
    const audio = chapter.querySelector('[data-preview]');
    const controls = chapter.querySelector('.preview-controls');
    const play = chapter.querySelector('[data-play]');
    const label = chapter.querySelector('[data-play-label]');
    const icon = chapter.querySelector('[data-play-icon]');
    const seek = chapter.querySelector('[data-preview-seek]');
    const clock = chapter.querySelector('[data-preview-time]');
    const status = chapter.querySelector('[data-preview-status]');
    let loading = false;

    function update() {
      const playing = !audio.paused && !audio.ended;
      play.setAttribute('aria-pressed', String(playing));
      play.setAttribute('aria-busy', String(loading));
      play.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name} preview`);
      icon.textContent = playing ? 'Ⅱ' : '▶';
      label.textContent = playing ? `Pause ${name}` : `Listen to ${name}`;
      const ready = Number.isFinite(audio.duration) && audio.duration > 0;
      seek.disabled = !ready;
      seek.value = ready ? Math.min(100, audio.currentTime / audio.duration * 100) : 0;
      clock.textContent = `${time(audio.currentTime)} / ${ready ? time(audio.duration) : '--:--'}`;
    }

    play.addEventListener('click', async () => {
      if (!audio.paused) {
        playRequest++;
        loading = false;
        audio.pause();
        status.textContent = 'Preview paused.';
        update();
        return;
      }
      const request = ++playRequest;
      players.forEach(other => { if (other !== audio) other.pause(); });
      loading = true;
      status.textContent = 'Loading preview…';
      update();
      try {
        if (audio.error) audio.load();
        await audio.play();
        if (request !== playRequest) { audio.pause(); return; }
        status.textContent = 'Playing collection preview.';
      } catch (error) {
        if (request === playRequest && error.name !== 'AbortError') {
          status.textContent = 'Preview could not play. Check your connection and tap Listen to retry.';
        }
      } finally {
        loading = false;
        update();
      }
    });

    ['loadedmetadata', 'durationchange', 'timeupdate'].forEach(event => audio.addEventListener(event, update));
    audio.addEventListener('playing', () => { loading = false; status.textContent = 'Playing collection preview.'; update(); });
    audio.addEventListener('pause', () => { loading = false; if (!audio.error && !audio.ended) status.textContent = 'Preview paused.'; update(); });
    audio.addEventListener('ended', () => { loading = false; status.textContent = 'Preview finished.'; update(); });
    audio.addEventListener('waiting', () => { loading = true; status.textContent = 'Buffering preview…'; update(); });
    audio.addEventListener('error', () => {
      loading = false;
      status.textContent = 'Preview could not load. Check your connection and tap Listen to retry.';
      update();
    });
    seek.addEventListener('input', () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      try { audio.currentTime = audio.duration * Number(seek.value) / 100; }
      catch { status.textContent = 'This preview is not ready to seek yet.'; }
      update();
    });
    // Hide the working native fallback only after custom controls are wired.
    audio.hidden = true;
    controls.hidden = false;
    update();

    const catalog = chapter.querySelector('[data-catalog]');
    const form = chapter.querySelector('.catalog-search');
    const search = chapter.querySelector('[data-catalog-search]');
    const entries = [...chapter.querySelectorAll('[data-catalog-entry]')];
    const count = chapter.querySelector('[data-catalog-count]');
    const empty = chapter.querySelector('[data-catalog-empty]');
    const close = chapter.querySelector('[data-catalog-close]');
    const normalize = value => value.normalize('NFKD').toLowerCase();
    const titles = entries.map(entry => normalize(entry.querySelector('.catalog-sound').textContent));
    function filter() {
      const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      let visible = 0;
      entries.forEach((entry, index) => {
        entry.hidden = !terms.every(term => titles[index].includes(term));
        if (!entry.hidden) visible++;
      });
      count.textContent = `${visible} of ${entries.length} instruments`;
      empty.hidden = visible !== 0;
    }
    function closeCatalog() {
      catalog.open = false;
      catalog.querySelector('summary').focus();
    }
    form.addEventListener('submit', event => event.preventDefault());
    search.addEventListener('input', filter);
    chapter.querySelector('[data-catalog-reset]').addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    close.addEventListener('click', closeCatalog);
    catalog.addEventListener('keydown', event => {
      if (event.key === 'Escape' && catalog.open) { event.preventDefault(); closeCatalog(); }
    });
    close.hidden = false;
    form.hidden = false;
  });

  function stopAll() {
    playRequest++;
    players.forEach(audio => {
      audio.pause();
      if (audio.readyState > 0) audio.currentTime = 0;
    });
  }
  addEventListener('pagehide', stopAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();
