function installHeroMultiFilter() {
  const tools = document.querySelector('.hero-directory-tools');
  const grid = document.querySelector('.hero-grid');
  if (!tools || !grid || tools.dataset.multiFilter || tools.dataset.categoryGrid) return;
  tools.dataset.multiFilter = '1';
  const filters = tools.querySelector('.hero-directory-filters');
  if (!filters) return;
  const hasAllFilter = Boolean(filters.querySelector('[data-hero-filter="all"]'));
  if (!hasAllFilter) filters.insertAdjacentHTML('afterbegin', '<button class="filter hero-default-filter active" data-hero-filter="default">Default</button>');
  const selected = new Set([hasAllFilter ? 'all' : 'default']);
  filters.querySelectorAll('[data-hero-filter]').forEach((item) => item.classList.toggle('active', selected.has(item.dataset.heroFilter)));
  const apply = () => {
    const query = tools.querySelector('input')?.value.trim().toLowerCase() || '';
    const active = [...selected];
    [...grid.querySelectorAll('.hero-card')].forEach((card) => {
      const id = card.dataset.hero || '';
      const label = card.querySelector('strong')?.textContent.toLowerCase() || '';
      const queryMatch = !query || id.includes(query) || label.includes(query);
      const categoryMatch = active.includes('default') || active.includes('all') || active.some((filter) => filter === heroAttribute(id));
      card.style.display = queryMatch && categoryMatch ? '' : 'none';
    });
  };
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-hero-filter]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const value = button.dataset.heroFilter;
    if (value === 'default' || value === 'all') {
      selected.clear();
      selected.add(value);
    } else {
      selected.delete('default');
      selected.delete('all');
      selected.has(value) ? selected.delete(value) : selected.add(value);
      if (!selected.size) selected.add('default');
    }
    filters.querySelectorAll('[data-hero-filter]').forEach((item) => item.classList.toggle('active', selected.has(item.dataset.heroFilter)));
    apply();
  }, true);
  tools.querySelector('input')?.addEventListener('input', apply);
  grid.querySelectorAll('.hero-downloads').forEach((button) => {
    const count = heroStats(button.dataset.heroStats).downloads.toLocaleString();
    const russian = state.data?.settings?.appLanguage === 'ru';
    button.textContent = '?';
    button.title = `${russian ? 'Скачивания' : 'Downloads'}: ${count} · ${russian ? 'Популярность героя' : 'Hero popularity'}`;
    button.setAttribute('aria-label', button.title);
  });
  apply();
}
const heroMultiFilterObserver = new MutationObserver(installHeroMultiFilter);
heroMultiFilterObserver.observe(document.body, { childList: true, subtree: true });
installHeroMultiFilter();
