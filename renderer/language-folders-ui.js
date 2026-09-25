async function loadRealLanguageFolders() {
  const select = document.querySelector('#language-folder');
  if (!select || select.dataset.loaded === '1') return;
  select.dataset.loaded = '1';
  try {
    const folders = await call('game:language-folders');
    const current = state.data.settings?.langSuffix || select.value;
    select.innerHTML = folders.length
      ? folders.map((folder) => `<option value="${folder}">${folder}</option>`).join('')
      : '<option value="">No language folders found</option>';
    if (folders.includes(current)) select.value = current;
  } catch {
    // Keep the settings page usable if the selected path is temporarily unavailable.
  }
}
const languageFolderObserver = new MutationObserver(loadRealLanguageFolders);
languageFolderObserver.observe(document.body, { childList: true, subtree: true });
loadRealLanguageFolders();
