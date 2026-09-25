document.addEventListener('click', (event) => {
  const home = event.target.closest('.nav-item[data-view="discover"]');
  if (home) {
    state.section = 'heroes';
    state.category = 'all';
    state.hero = '';
    state.heroQuery = '';
    state.lastModsSection = 'heroes';
  }
}, true);
