function simplifyHeroDirectory() {
  const tools = document.querySelector('.hero-directory-tools');
  const grid = document.querySelector('.hero-grid');
  if (!tools || !grid) return;
  tools.querySelector('.hero-directory-search')?.remove();
  if (tools.dataset.simpleHero) return;
  tools.dataset.simpleHero = '1';
  const input = tools.querySelector('input');
  if (input) input.placeholder = document.body.dataset.uiLanguage === 'ru' ? 'Поиск героев' : 'Search heroes';
  const sort = () => {
    const query = input?.value.trim().toLowerCase() || '';
    const cards = [...grid.querySelectorAll('.hero-card')];
    cards.sort((a, b) => (a.querySelector('strong')?.textContent || '').localeCompare(b.querySelector('strong')?.textContent || '', undefined, { sensitivity: 'base' }));
    cards.forEach((card) => { card.style.display = !query || (card.querySelector('strong')?.textContent || '').toLowerCase().includes(query) ? '' : 'none'; grid.appendChild(card); });
  };
  input?.addEventListener('input', sort);
  sort();
}
const heroSimpleObserver = new MutationObserver(simplifyHeroDirectory);
heroSimpleObserver.observe(document.body, { childList: true, subtree: true });
simplifyHeroDirectory();
