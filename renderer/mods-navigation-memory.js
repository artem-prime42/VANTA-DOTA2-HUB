document.querySelectorAll('.nav-item[data-view="mods"]').forEach((button) => {
  button.addEventListener('click', () => {
    state.section = state.lastModsSection || 'heroes';
    state.hero = '';
    loadCatalog();
  });
});
document.querySelectorAll('.top-tab').forEach((button) => {
  button.addEventListener('click', () => {
    state.lastModsSection = button.dataset.top;
    state.section = button.dataset.top;
  });
});
