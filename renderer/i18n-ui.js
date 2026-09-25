const UI_TEXT = {
  en: { home: 'Home', mods: 'Mods', library: 'Library', savedPacks: 'Packs', authors: 'Authors', guides: 'Guides', settings: 'Settings', heroes: 'Heroes', world: 'World', interface: 'Interface', effects: 'Effects', other: 'Other', default: 'Default', popular: 'Popular', all: 'All', strength: 'Strength', agility: 'Agility', intelligence: 'Intelligence', universal: 'Universal', searchHeroes: 'Search heroes', catalog: 'Catalog', refresh: 'Refresh catalog', enable: 'Enabled', disable: 'Disabled', remove: 'Remove', selected: 'selected', downloads: 'downloads' },
  ru: { home: 'Главная', mods: 'Моды', library: 'Библиотека', savedPacks: 'Паки', authors: 'Авторы', guides: 'Гайды', settings: 'Настройки', heroes: 'Герои', world: 'Мир', interface: 'Интерфейс', effects: 'Эффекты', other: 'Другое', default: 'По умолчанию', popular: 'Популярные', all: 'Все', strength: 'Сила', agility: 'Ловкость', intelligence: 'Интеллект', universal: 'Универсальные', searchHeroes: 'Поиск героев', catalog: 'Каталог', refresh: 'Обновить каталог', enable: 'Включено', disable: 'Выключено', remove: 'Удалить', selected: 'выбрано', downloads: 'скачиваний' },
};
function applyUiLanguage() {
  const language = state.data?.settings?.appLanguage === 'ru' ? 'ru' : 'en';
  if (document.body.dataset.uiLanguage === language) return;
  document.body.dataset.uiLanguage = language;
  const text = UI_TEXT[language];
  const labels = { discover: text.home, mods: text.mods, installed: text.library, 'saved-packs': text.savedPacks, authors: text.authors, guides: text.guides, settings: text.settings };
  document.querySelectorAll('.nav-item').forEach((button) => { const view = button.dataset.view; const label = button.lastChild; if (label && labels[view]) label.textContent = labels[view]; });
  const tabs = { heroes: text.heroes, world: text.world, interface: text.interface, effects: text.effects, other: text.other };
  document.querySelectorAll('.top-tab').forEach((button) => { if (tabs[button.dataset.top]) button.textContent = tabs[button.dataset.top]; });
  document.querySelector('#page-title')?.replaceChildren(document.createTextNode(labels[state.view] || text.home));
  document.querySelector('#refresh span')?.replaceChildren(document.createTextNode(text.refresh));
}
const i18nObserver = new MutationObserver(applyUiLanguage);
i18nObserver.observe(document.body, { childList: true, subtree: true });
