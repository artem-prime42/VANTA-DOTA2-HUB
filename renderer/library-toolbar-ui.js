function bindLibraryToolbar() {
  const host = document.querySelector('.library-header-actions');
  if (!host || host.querySelector('.library-sort-select')) return;
  host.insertAdjacentHTML('afterbegin', `<label class="library-sort-control"><span>${t('catalog.sortLabel', 'Sort')}</span><select class="library-sort-select"><option value="default">${t('catalog.defaultSort', 'Default')}</option><option value="name">${t('catalog.nameAZ', 'Name A-Z')}</option><option value="name-desc">${t('catalog.nameZA', 'Name Z-A')}</option></select></label>`);
  const select = host.querySelector('.library-sort-select');
  select.value = state.librarySort || 'default';
  select.onchange = () => { state.librarySort = select.value; sortLibraryRows(select.value); };
  sortLibraryRows(select.value);
  decorateLibraryRows();
}
function decorateLibraryRows() {
  document.querySelectorAll('.library-mod:not(.external-file)').forEach((row) => {
    if (row.querySelector('[data-library-rename]')) return;
    const id = row.querySelector('[data-library-select]')?.dataset.librarySelect;
    if (!id) return;
    const button = document.createElement('button'); button.className = 'action secondary'; button.textContent = t('catalog.rename', 'Rename'); button.dataset.libraryRename = id;
    button.onclick = async () => { const record = state.data.installed?.[id]; const result = await showAppInputDialog({ title: t('catalog.renameTitle', 'Rename item'), label: t('catalog.libraryNamePrompt', 'Library name'), value: record?.displayName || record?.name || '', placeholder: t('catalog.libraryNamePrompt', 'Library name'), confirmLabel: t('common.save', 'Save'), validate: (value) => !value ? t('catalog.libraryNameRequired', 'Enter a name.') : '' }); if (!result.confirmed) return; try { state.data = await call('mod:rename', { id, name: result.value }); renderLibrary(); toast(t('catalog.libraryItemRenamed', 'Library item renamed.')); } catch (error) { toast(error.message); } };
    row.querySelector('.library-mod-actions')?.prepend(button);
  });
}
function sortLibraryRows(mode) {
  document.querySelectorAll('.library-mod-list').forEach((list) => {
    const rows = [...list.querySelectorAll('.library-mod')];
    rows.sort((left, right) => {
      const a = left.querySelector('.library-mod-info strong')?.textContent || '';
      const b = right.querySelector('.library-mod-info strong')?.textContent || '';
      return mode === 'name-desc' ? b.localeCompare(a) : mode === 'name' ? a.localeCompare(b) : 0;
    });
    rows.forEach((row) => list.appendChild(row));
  });
}
const libraryToolbarObserver = new MutationObserver(bindLibraryToolbar);
libraryToolbarObserver.observe(document.body, { childList: true, subtree: true });
bindLibraryToolbar();
