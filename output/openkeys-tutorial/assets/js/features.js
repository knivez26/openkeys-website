(() => {
  const form = document.querySelector('.feature-tools');
  if (!form) return;
  const search = document.querySelector('#feature-search');
  const entries = [...document.querySelectorAll('.feature-entry')];
  const buttons = [...form.querySelectorAll('[data-filter]')];
  const status = document.querySelector('#feature-results');
  const empty = document.querySelector('#feature-empty');
  const normalize = value => value.normalize('NFKD').toLowerCase();
  const content = new Map(entries.map(entry => [entry, normalize(entry.textContent)]));
  let selected = 'all';

  function update() {
    const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
    let visible = 0;
    entries.forEach(entry => {
      const matches = (selected === 'all' || entry.dataset.access === selected)
        && terms.every(term => content.get(entry).includes(term));
      entry.hidden = !matches;
      if (matches) {
        visible++;
        if (terms.length) entry.querySelector('details').open = true;
      }
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === selected)));
    status.textContent = `${visible} of ${entries.length} feature groups${terms.length ? ' match your search' : ' shown'}`;
    empty.hidden = visible !== 0;
  }

  search.addEventListener('input', update);
  buttons.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    update();
  }));
  form.querySelector('.feature-reset').addEventListener('click', () => {
    selected = 'all';
    search.value = '';
    update();
  });
  document.querySelectorAll('.feature-jumps a').forEach(link => link.addEventListener('click', () => {
    selected = 'all';
    search.value = '';
    update();
  }));
  update();
})();
