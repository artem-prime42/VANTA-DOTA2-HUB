function bindExternalLibraryUi() {
  const section = document.querySelector('.external-files-section');
  if (!section || section.dataset.bound) return;
  section.dataset.bound = '1';
  section.querySelectorAll('.external-badge').forEach((badge) => badge.remove());
  section.querySelectorAll('.external-file').forEach((row, index) => {
    const file = state.data.external[index];
    if (!file) return;
    const controls = document.createElement('div');
    controls.className = 'external-file-controls';
    controls.innerHTML = `<label class="library-check"><input type="checkbox" data-external-select="${file.id}" ${state.librarySelection.has(file.id) ? 'checked' : ''}><span></span></label><button class="toggle-button ${file.enabled ? 'on' : ''}" data-external-toggle="${file.relativePath}">${file.enabled ? t('catalog.actionEnabled', 'Enabled') : t('catalog.actionDisabled', 'Disabled')}</button><button class="action secondary" data-external-remove="${file.relativePath}">${t('catalog.uninstall', 'Remove')}</button>`;
    row.appendChild(controls);
  });
  section.querySelectorAll('[data-external-select]').forEach((input) => input.onchange = () => { input.checked ? state.librarySelection.add(input.dataset.externalSelect) : state.librarySelection.delete(input.dataset.externalSelect); syncLibraryBulkUi(); });
  section.querySelectorAll('[data-external-toggle]').forEach((button) => button.onclick = async () => { state.data = await call('external:set-enabled', { relativePath: button.dataset.externalToggle, enabled: button.textContent.trim() !== t('catalog.actionEnabled', 'Enabled') }); renderLibrary(); });
  section.querySelectorAll('[data-external-remove]').forEach((button) => button.onclick = async () => { const confirmation = await showAppConfirmDialog({ title: t('catalog.removeLibraryItemTitle', 'Remove library item'), message: t('catalog.removeExternalFile', 'Remove this external file from Dota 2?'), confirmLabel: t('catalog.uninstall', 'Remove'), destructive: true }); if (!confirmation.confirmed) return; state.librarySelection.delete(`external:${button.dataset.externalRemove}`); state.data = await call('external:remove', { relativePath: button.dataset.externalRemove }); renderLibrary(); });
  document.querySelector('#library-select-all')?.addEventListener('click', () => { state.data.external.forEach((file) => state.librarySelection.add(file.id)); renderLibrary(); });
  const addExternalBulk = (selector, action) => document.querySelector(selector)?.addEventListener('click', async () => { const selected = [...state.librarySelection].filter((id) => id.startsWith('external:')); for (const id of selected) { const file = state.data.external.find((item) => item.id === id); if (file) await call(action, action === 'external:set-enabled' ? { relativePath: file.relativePath, enabled: selector.includes('enable') } : { relativePath: file.relativePath }); } if (selected.length) { state.data = await call('library:get'); renderLibrary(); } });
  addExternalBulk('#library-enable-selected', 'external:set-enabled');
  addExternalBulk('#library-disable-selected', 'external:set-enabled');
}
const externalLibraryObserver = new MutationObserver(bindExternalLibraryUi);
externalLibraryObserver.observe(document.body, { childList: true, subtree: true });
