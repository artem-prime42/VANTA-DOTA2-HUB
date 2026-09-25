function libraryEscape(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function librarySlotLabel(slot) {
  const raw = String(slot || '').trim();
  if (!raw) return '';
  const normalized = raw.toLowerCase().replace(/_/g, ' ');
  const map = {
    head: 'slot.head',
    hands: 'slot.hands',
    summon: 'slot.summon',
    shoulders: 'slot.shoulders',
    belt: 'slot.belt',
    back: 'slot.back',
    weapon: 'slot.weapon',
    set: 'slot.set',
    'off hand': 'slot.offhand',
    offhand: 'slot.offhand',
    'off hand': 'slot.offhand',
    armor: 'slot.armor',
    armour: 'slot.armor'
  };
  return t(map[normalized] || map[raw.toLowerCase()] || normalized, normalized.replace(/\s+/g, ' '));
}

function libraryItemId(item) { return item.id || item.modId; }
function libraryPriorityValue(item) {
  const explicit = Number(item?.priority);
  if (Number.isFinite(explicit)) return explicit;
  const match = String(item?.fileName || '').match(/pak(\d{2})_dir\.vpk/i);
  return match ? Number.parseInt(match[1], 10) : 99;
}
function libraryPriorityLabel(item) {
  const value = libraryPriorityValue(item);
  return `Priority ${String(value).padStart(2, '0')}`;
}
function findLibraryItem(id) { const items = Array.isArray(state.data.installed) ? state.data.installed : Object.values(state.data.installed || {}); return items.find((item) => libraryItemId(item) === id); }
function hasInstalledLibraryId(id) {
  if (!id) return false;
  const items = Array.isArray(state.data.installed) ? state.data.installed : Object.values(state.data.installed || {});
  return items.some((item) => libraryItemId(item) === id);
}
function normalizeLibraryCategoryKey(value) {
  if (!value) return 'other';
  const category = String(value).trim();
  return {
    Pack: 'packs',
    pack: 'packs',
    Heroes: 'heroes',
    'Hero sounds': 'hero-sounds',
    'Hero sounds': 'hero-sounds',
    'Hero items': 'hero-items',
    'Hero effects': 'herofx',
    Sounds: 'sounds',
    'Menu backgrounds': 'backgrounds',
    HUDs: 'huds',
    "Versus Screen": 'versus-screens',
    'Item icons': 'item-icons',
    'Item effects': 'item-effects',
    'High five': 'high-five',
    World: 'world',
    Interface: 'interface',
    Effects: 'effects',
    Other: 'other'
  }[category] ?? (category in (CATEGORY_LABELS || {}) ? category : category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
}
function libraryCategory(item) {
  if (item.type === 'pack') return t('catalog.filterPacks', 'Packs');
  const raw = item.category || item.categoryId || 'other';
  const key = normalizeLibraryCategoryKey(raw);
  return CATEGORY_LABELS[key] || CATEGORY_LABELS[raw] || t('catalog.filterOther', 'Other');
}
function libraryCategoryOrder(category) {
  const key = normalizeLibraryCategoryKey(category);
  return { packs: 0, heroes: 1, 'hero-sounds': 2, other: 3, world: 4, interface: 5, effects: 6 }[key] ?? 99;
}
function libraryFilterForItem(item) { if (item.type === 'pack') return 'packs'; const category = item.categoryId || ''; if (['heroes', 'hero-items', 'herofx'].includes(category)) return 'heroes'; if (category === 'hero-sounds') return 'hero-sounds'; if (['terrains', 'trees', 'river', 'creeps', 'towers', 'roshan', 'ancient', 'tormentor', 'wards', 'couriers', 'pedestal', 'creep-deny'].includes(category)) return 'world'; if (['backgrounds', 'huds', 'emblems', 'versus-screens', 'item-icons', 'ranks', 'pings', 'cursors'].includes(category)) return 'interface'; if (['shaders', 'ti-bp-effects', 'item-effects', 'ranged-attack', 'high-five'].includes(category)) return 'effects'; return 'other'; }
function libraryFilterOptions() { const russian = state.data?.settings?.appLanguage === 'ru'; return [{ id: 'all', ru: 'Все', en: 'All' }, { id: 'heroes', ru: 'Герои', en: 'Heroes' }, { id: 'packs', ru: 'Паки', en: 'Packs' }, { id: 'world', ru: 'Мир', en: 'World' }, { id: 'interface', ru: 'Интерфейс', en: 'Interface' }, { id: 'effects', ru: 'Эффекты', en: 'Effects' }, { id: 'hero-sounds', ru: 'Звуки героев', en: 'Hero sounds' }, { id: 'other', ru: 'Остальное', en: 'Other' }].map((option) => ({ ...option, label: russian ? option.ru : option.en })); }

function showUnifiedPackContents(pack) {
  if (!pack) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'pack-content-dialog';
  const sources = pack.sourceMods || pack.packMods || [];
  dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="${t('common.close', 'Close')}">×</button><div class="pack-content-body"><p class="eyebrow">${t('catalog.packContents', 'PACK CONTENTS')}</p><h2>${libraryEscape(pack.displayName || pack.name)}</h2><p class="pack-content-count">${formatTranslation(t('catalog.heroModsCount', '{count} mods'), { count: sources.length })}</p><div class="pack-mod-card-grid">${sources.length ? sources.map((source) => { const preview = source.previewUrl ? `<img src="${libraryEscape(source.previewUrl)}" loading="lazy" alt="">` : '<div class="pack-mod-card-empty">◈</div>'; const subtitle = [source.heroLabel || source.hero, librarySlotLabel(source.slot), source.author].filter(Boolean).map(libraryEscape).join(' · '); return `<article class="pack-mod-card">${preview}<div><strong>${libraryEscape(source.displayName || source.name || source.id || source.modId)}</strong>${subtitle ? `<small>${subtitle}</small>` : ''}</div></article>`; }).join('') : `<div class="empty"><strong>${t('catalog.packNoMetadata', 'No mod metadata')}</strong>${t('catalog.packNoMetadataHint', 'This pack has no stored mod metadata.')}</div>`}</div></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  dialog.onclick = (event) => { if (event.target === dialog) dialog.close(); };
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
}

function renderLibrary() {
  const items = Object.values(state.data.installed || {});
  const filter = state.libraryFilter || 'all';
  const query = String(state.query || '').trim().toLowerCase();
  const visibleItems = items
    .slice()
    .sort((left, right) => libraryPriorityValue(left) - libraryPriorityValue(right))
    .filter((item) => {
    if (filter !== 'all' && libraryFilterForItem(item) !== filter) return false;
    if (!query) return true;
    return [item.displayName, item.name, item.categoryId, item.category, item.hero, item.heroLabel, item.fileName, ...(item.installedFiles || [])].filter(Boolean).join(' ').toLowerCase().includes(query);
  });
  const groups = new Map();
  visibleItems.forEach((item) => { const category = libraryCategory(item); if (!groups.has(category)) groups.set(category, []); groups.get(category).push(item); });
  const selected = state.librarySelection;
  const row = (item) => {
    const id = libraryItemId(item);
    const pack = item.type === 'pack';
    const name = item.displayName || item.name || id;
    const fileName = item.fileName || item.installedFiles?.[0] || '';
    const checkbox = `<label class="library-check"><input type="checkbox" data-library-select="${libraryEscape(id)}" ${selected.has(id) ? 'checked' : ''}><span></span></label>`;
    const packButton = pack ? `<button class="action secondary library-pack-info" data-pack-content="${libraryEscape(id)}" title="${t('catalog.viewPackContents', 'View Pack contents')}" aria-label="${t('catalog.viewPackContents', 'View Pack contents')}">!</button>` : '';
    const savePackButton = pack ? `<button class="action secondary" data-save-pack="${libraryEscape(id)}">${t('savedPacks.savePack', 'Save pack')}</button>` : '';
    const dragHandle = `<button type="button" class="library-drag-handle" draggable="true" aria-label="Reorder mod" data-library-drag-id="${libraryEscape(id)}"><span class="drag-dots"><i></i><i></i><i></i><i></i><i></i><i></i></span></button>`;
    return `<article class="library-mod ${pack ? 'library-pack-item' : ''} ${selected.has(id) ? 'selected' : ''}" data-library-id="${libraryEscape(id)}">${dragHandle}${checkbox}${item.previewUrl ? `<img src="${libraryEscape(item.previewUrl)}" loading="lazy" alt="">` : '<div class="library-thumb-empty">◈</div>'}<div class="library-mod-info"><strong>${libraryEscape(name)}</strong><small>${libraryEscape(libraryCategory(item))}${item.heroLabel ? ` · ${libraryEscape(item.heroLabel)}` : ''}${item.slot ? ` · ${libraryEscape(librarySlotLabel(item.slot))}` : ''}</small><small>${libraryEscape(libraryPriorityLabel(item))} · ${libraryEscape(fileName)} · ${item.enabled === false ? t('catalog.actionDisabled', 'Disabled') : t('catalog.actionEnabled', 'Enabled')}</small></div><div class="library-mod-actions"><button class="toggle-button ${item.enabled !== false ? 'on' : ''}" data-library-toggle="${libraryEscape(id)}" data-library-enabled="${item.enabled !== false}">${item.enabled !== false ? t('catalog.actionEnabled', 'Enabled') : t('catalog.actionDisabled', 'Disabled')}</button>${packButton}${savePackButton}<button class="action secondary" data-library-remove="${libraryEscape(id)}">${t('catalog.uninstall', 'Remove')}</button></div></article>`;
  };
  const sections = [...groups.entries()].sort(([left], [right]) => libraryCategoryOrder(left) - libraryCategoryOrder(right) || left.localeCompare(right)).map(([category, categoryItems]) => `<section class="library-section"><div class="library-section-heading"><h2>${libraryEscape(category)}</h2><span>${categoryItems.length}</span></div><div class="library-mod-list">${categoryItems.map(row).join('')}</div></section>`).join('');
  $('#content').innerHTML = `<div class="library-header"><div><p class="eyebrow">${t('catalog.libraryLocal', 'LOCAL LIBRARY')}</p><p>${t('catalog.libraryManage', 'Manage VPK files stored by VANTA.')}</p><div class="library-filters" role="tablist" aria-label="${t('catalog.libraryFilters', 'Library filters')}">${libraryFilterOptions().map((option) => `<button class="library-filter ${filter === option.id ? 'active' : ''}" data-library-filter="${option.id}">${option.label}</button>`).join('')}</div></div><div class="library-header-actions"><button class="action secondary" id="library-select-all">${t('catalog.selectAll', 'Select all')}</button></div></div><div class="library-bulk"><span>${selected.size} ${t('catalog.selectedShort', 'selected')}</span><button class="action secondary" id="library-enable-selected" ${selected.size ? '' : 'disabled'}>${t('catalog.enableSelected', 'Enable selected')}</button><button class="action secondary" id="library-disable-selected" ${selected.size ? '' : 'disabled'}>${t('catalog.disableSelected', 'Disable selected')}</button><button class="action secondary" id="library-remove-selected" ${selected.size ? '' : 'disabled'}>${t('catalog.removeSelected', 'Remove selected')}</button></div>${sections || `<div class="empty"><strong>${t('catalog.libraryEmptyTitle', 'Library is empty')}</strong>${t('catalog.libraryEmptyHint', 'Install or import a VPK to see it here.')}</div>`}`;
  bindUnifiedLibrary();
  renderExternalFiles();
  syncLibraryBulkUi();
}

function bindUnifiedLibrary() {
  document.querySelectorAll('[data-library-filter]').forEach((button) => { button.onclick = () => { state.libraryFilter = button.dataset.libraryFilter; renderLibrary(); }; });
  document.querySelectorAll('[data-library-select]').forEach((input) => { input.onchange = () => { input.checked ? state.librarySelection.add(input.dataset.librarySelect) : state.librarySelection.delete(input.dataset.librarySelect); renderLibrary(); }; });
  document.querySelectorAll('[data-library-toggle]').forEach((button) => { button.onclick = async () => { try { const item = findLibraryItem(button.dataset.libraryToggle); state.data = await call('mod:set-enabled', { id: button.dataset.libraryToggle, enabled: item?.enabled === false }); renderLibrary(); } catch (error) { toast(error.message); } }; });
  document.querySelectorAll('[data-library-rename]').forEach((button) => { button.onclick = async () => { const item = findLibraryItem(button.dataset.libraryRename); const result = await showAppInputDialog({ title: t('catalog.renameTitle', 'Rename item'), label: t('catalog.libraryNamePrompt', 'Library name'), value: item?.displayName || item?.name || '', placeholder: t('catalog.libraryNamePrompt', 'Library name'), confirmLabel: t('common.save', 'Save'), validate: (value) => !value ? t('catalog.libraryNameRequired', 'Enter a name.') : '' }); if (!result.confirmed) return; try { state.data = await call('mod:rename', { id: button.dataset.libraryRename, name: result.value }); renderLibrary(); } catch (error) { toast(error.message); } }; });
  document.querySelectorAll('[data-library-remove]').forEach((button) => { button.onclick = async () => { const confirmation = await showAppConfirmDialog({ title: t('catalog.removeLibraryItemTitle', 'Remove library item'), message: t('catalog.removeLibraryItem', 'Remove this Library item?'), confirmLabel: t('catalog.uninstall', 'Remove'), destructive: true }); if (!confirmation.confirmed) return; try { state.data = await call('mod:uninstall', { id: button.dataset.libraryRemove }); state.librarySelection.delete(button.dataset.libraryRemove); renderLibrary(); } catch (error) { toast(error.message); } }; });
  document.querySelectorAll('[data-pack-content]').forEach((button) => { button.onclick = async () => { try { showUnifiedPackContents(await call('library:pack-contents', { id: button.dataset.packContent })); } catch (error) { toast(/missing/i.test(error.message) ? t('savedPacks.fileMissing', 'Saved pack file was not found.') : t('savedPacks.viewerError', 'Could not open pack contents.')); } }; });
  document.querySelectorAll('[data-save-pack]').forEach((button) => { button.onclick = async () => {
    const pack = findLibraryItem(button.dataset.savePack);
    const result = await showAppInputDialog({
      title: t('savedPacks.saveTitle', 'Save pack'),
      label: t('savedPacks.savePrompt', 'Pack name'),
      value: pack?.displayName || pack?.name || '',
      placeholder: t('savedPacks.namePlaceholder', 'My pack'),
      confirmLabel: t('common.save', 'Save'),
      validate: (value) => {
        if (!value) return t('savedPacks.validationRequired', 'Enter a pack name.');
        if (value.length > 80) return t('savedPacks.validationTooLong', 'Pack name is too long.');
        return '';
      }
    });
    if (!result.confirmed) return;
    try {
      state.data = await call('saved-packs:save', { name: result.value, packId: button.dataset.savePack });
      state.view = 'saved-packs';
      await loadCatalog();
      toast(t('savedPacks.saved', 'Saved pack created.'));
    } catch (error) { toast(error.message); }
  }; });
  document.querySelectorAll('.library-drag-handle').forEach((handle) => {
    handle.addEventListener('dragstart', (event) => {
      const id = handle.dataset.libraryDragId;
      if (!id) return;
      state.libraryDraggingId = id;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      handle.closest('.library-mod')?.classList.add('dragging');
    });
    handle.addEventListener('dragend', () => {
      state.libraryDraggingId = '';
      document.querySelectorAll('.library-mod').forEach((row) => row.classList.remove('dragging', 'drop-target'));
    });
  });
  document.querySelectorAll('.library-mod').forEach((row) => {
    row.addEventListener('dragover', (event) => {
      if (!state.libraryDraggingId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.library-mod').forEach((item) => item.classList.toggle('drop-target', item === row));
    });
    row.addEventListener('drop', async (event) => {
      if (!state.libraryDraggingId) return;
      event.preventDefault();
      const draggedId = state.libraryDraggingId;
      const targetId = row.dataset.libraryId;
      if (!draggedId || !targetId || draggedId === targetId) return;
      const currentOrder = Array.from(document.querySelectorAll('.library-mod[data-library-id]')).map((item) => item.dataset.libraryId);
      const sourceIndex = currentOrder.indexOf(draggedId);
      const targetIndex = currentOrder.indexOf(targetId);
      if (sourceIndex < 0 || targetIndex < 0) return;
      const nextOrder = [...currentOrder];
      const [movedId] = nextOrder.splice(sourceIndex, 1);
      nextOrder.splice(targetIndex, 0, movedId);
      try {
        state.data = await call('mod:reorder', { ids: nextOrder });
        renderLibrary();
      } catch (error) { toast(error.message); }
      finally { state.libraryDraggingId = ''; document.querySelectorAll('.library-mod').forEach((item) => item.classList.remove('dragging', 'drop-target')); }
    });
  });
  $('#library-select-all')?.addEventListener('click', () => { Object.values(state.data.installed || {}).forEach((item) => state.librarySelection.add(libraryItemId(item))); (state.data.external || []).forEach((file) => state.librarySelection.add(file.id)); renderLibrary(); });
  $('#library-pack')?.addEventListener('click', () => { const ids = [...state.librarySelection].filter((id) => !id.startsWith('external:')); if (ids.length < 2) return toast(t('catalog.selectAtLeastTwoMods', 'Select at least two mods to merge.')); openMergePackDialog(ids); });
  const selectedManaged = () => [...state.librarySelection].filter((id) => !id.startsWith('external:'));
  $('#library-enable-selected')?.addEventListener('click', async () => { const ids = selectedManaged(); if (!ids.length) return toast(t('catalog.selectInstalledMod', 'Select an installed mod.')); for (const id of ids) await call('mod:set-enabled', { id, enabled: true }); state.data = await call('library:get'); renderLibrary(); });
  $('#library-disable-selected')?.addEventListener('click', async () => { const ids = selectedManaged(); if (!ids.length) return toast(t('catalog.selectInstalledMod', 'Select an installed mod.')); for (const id of ids) await call('mod:set-enabled', { id, enabled: false }); state.data = await call('library:get'); renderLibrary(); });
  $('#library-remove-selected')?.addEventListener('click', async () => { const managed = selectedManaged(); const external = [...state.librarySelection].filter((value) => value.startsWith('external:')); if (!managed.length && !external.length) return toast(t('catalog.selectModFirst', 'Select a mod first.')); const confirmation = await showAppConfirmDialog({ title: t('catalog.removeSelectedModTitle', 'Remove selected mods'), message: formatTranslation(t('catalog.removeSelectedCount', 'Remove {count} selected mod(s)?'), { count: managed.length + external.length }), confirmLabel: t('catalog.uninstall', 'Remove'), destructive: true }); if (!confirmation.confirmed) return; for (const id of managed) await call('mod:uninstall', { id }); for (const id of external) { const file = state.data.external.find((item) => item.id === id); if (file) await call('external:remove', { relativePath: file.relativePath }); } state.librarySelection.clear(); state.data = await call('library:get'); renderLibrary(); });
}

window.renderLibrary = renderLibrary;
window.bindLibrary = bindUnifiedLibrary;
