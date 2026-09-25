document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-card-author], [data-card-hero], [data-card-category]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const categorySections = {
    heroes: 'heroes', 'hero-items': 'heroes', herofx: 'heroes', 'hero-sounds': 'other',
    terrains: 'world', trees: 'world', river: 'world', creeps: 'world', towers: 'world', roshan: 'world', ancient: 'world', tormentor: 'world', wards: 'world', couriers: 'world', pedestal: 'other', 'creep-deny': 'effects',
    backgrounds: 'interface', huds: 'interface', emblems: 'interface', 'versus-screens': 'interface', 'item-icons': 'interface', ranks: 'interface', pings: 'interface', cursors: 'interface', announcers: 'interface', 'mega-kill': 'interface', music: 'interface',
    shaders: 'effects', 'ti-bp-effects': 'effects', 'item-effects': 'effects', 'ranged-attack': 'effects', 'high-five': 'effects',
    packs: 'interface', optimization: 'other', other: 'other', sites: 'other', announcers: 'interface', music: 'interface', sounds: 'other', 'mega-kill': 'interface', fonts: 'other'
  };
  if (button.dataset.cardAuthor) {
    state.view = 'authors';
    state.author = button.dataset.cardAuthor;
    state.authorQuery = '';
    state.authorSort = 'default';
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'authors'));
  } else if (button.dataset.cardHero) {
    state.view = 'mods';
    state.section = 'heroes';
    state.hero = button.dataset.cardHero;
    state.heroSlot = button.dataset.cardSlot || 'all';
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'mods'));
  } else {
    state.view = 'mods';
    state.section = categorySections[button.dataset.cardCategory] || 'other';
    state.category = button.dataset.cardCategory;
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'mods'));
  }
  loadCatalog();
}, true);

document.addEventListener('click', (event) => {
  if (event.target.closest('.nav-item, .top-tab')) document.querySelector('#details')?.close();
});

document.querySelector('#details')?.addEventListener('click', (event) => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});
