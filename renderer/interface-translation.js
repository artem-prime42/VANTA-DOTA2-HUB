const INTERFACE_LABELS = {
  ru: { 'Install mod': 'Установить', Install: 'Установить', Installed: 'Установлено', Uninstall: 'Удалить', Remove: 'Удалить', Update: 'Обновить', 'Update available': 'Доступно обновление', Cosmetic: 'Косметика', downloads: 'скачиваний', 'Community mod': 'Мод сообщества', Enabled: 'Включено', Disabled: 'Выключено', 'Select all': 'Выбрать всё', 'Create pack': 'Создать пак', 'Merge mods': 'Объединить моды', 'Enable selected': 'Включить выбранные', 'Disable selected': 'Выключить выбранные', 'Remove selected': 'Удалить выбранные', 'All mods': 'Все моды', 'No mods found': 'Моды не найдены', 'Search this hero\'s mods': 'Поиск модов героя' },
  en: { 'Установить': 'Install', 'Установлено': 'Installed', 'Удалить': 'Remove', 'Обновить': 'Update', 'Доступно обновление': 'Update available', 'Косметика': 'Cosmetic', 'скачиваний': 'downloads', 'Мод сообщества': 'Community mod', 'Включено': 'Enabled', 'Выключено': 'Disabled', 'Выбрать всё': 'Select all', 'Создать пак': 'Create pack', 'Объединить моды': 'Merge mods', 'Включить выбранные': 'Enable selected', 'Выключить выбранные': 'Disable selected', 'Удалить выбранные': 'Remove selected', 'Все моды': 'All mods', 'Моды не найдены': 'No mods found', 'Поиск модов героя': "Search this hero's mods" },
};
function translateInterfaceControls() {
  const language = state.data?.settings?.appLanguage === 'ru' ? 'ru' : 'en';
  const labels = INTERFACE_LABELS[language];
  document.querySelectorAll('button, option, input[placeholder]').forEach((element) => {
    const source = element.tagName === 'INPUT' ? element.placeholder : element.textContent.trim();
    if (!labels[source]) return;
    if (element.tagName === 'INPUT') element.placeholder = labels[source];
    else element.textContent = labels[source];
  });
}
const interfaceTranslationObserver = new MutationObserver(() => requestAnimationFrame(translateInterfaceControls));
interfaceTranslationObserver.observe(document.body, { childList: true, subtree: true });
