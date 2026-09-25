function escapePackText(value) {
  return String(value || '').replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function packMods(pack) {
  return (pack.packMods || []).map((mod) => typeof mod === 'string' ? { name: mod } : mod);
}

function findInstalledPack(id) {
  return (state.data.packs || []).find((pack) => (pack.id || pack.modId) === id || pack.modId === id);
}

function packCard(mod) {
  const preview = mod.previewUrl ? `<img src="${escapePackText(mod.previewUrl)}" loading="lazy" alt="">` : '<div class="pack-mod-card-empty">◈</div>';
  const authorName = String(mod.author || '').trim();
  const subtitleParts = [mod.heroLabel || mod.hero, slotLabel(mod.slot)].filter(Boolean);
  if (authorName && !/^anonymous$/i.test(authorName)) subtitleParts.push(authorName);
  const subtitle = subtitleParts.map(escapePackText).join(' · ');
  return `<article class="pack-mod-card">${preview}<div><strong>${escapePackText(mod.name || mod.modId || 'Unnamed mod')}</strong>${subtitle ? `<small>${subtitle}</small>` : ''}</div></article>`;
}

function showPackContents(pack) {
  const dialog = document.createElement('dialog');
  dialog.className = 'pack-content-dialog';
  const mods = packMods(pack);
  dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="Close">×</button><div class="pack-content-body"><p class="eyebrow">PACK CONTENTS</p><h2>${escapePackText(pack.name)}</h2><p class="pack-content-count">${mods.length} mods</p><div class="pack-mod-card-grid">${mods.length ? mods.map(packCard).join('') : '<div class="empty"><strong>No mod metadata</strong>This pack was created before pack contents were stored.</div>'}</div></div>`;
  document.body.appendChild(dialog);
  dialog.querySelector('.dialog-close').onclick = () => dialog.close();
  dialog.onclick = (event) => { if (event.target === dialog) dialog.close(); };
  dialog.addEventListener('close', () => dialog.remove());
  dialog.showModal();
}

function syncPackControls() {
  const section = document.querySelector('.packs-section');
  if (!section || section.dataset.packUi === '1') return;
  const packs = state.data.packs || [];
  if (!packs.length) return;
  section.dataset.packUi = '1';
  section.innerHTML = `<div class="library-section-heading"><h2>${t('catalog.filterPacks', 'Packs')}</h2><span>${packs.length}</span></div><div class="pack-list">${packs.map((pack) => { const id = pack.id || pack.modId; const active = pack.enabled !== false; return `<article class="pack-row"><div class="pack-row-actions"><button class="action ${active ? 'secondary' : ''}" data-pack-install="${escapePackText(id)}">${active ? t('catalog.packDisabled', 'Disable') : t('catalog.packInstall', 'Install')}</button><button class="action secondary" data-pack-rebuild="${escapePackText(id)}">${t('catalog.packRebuild', 'Rebuild')}</button><button class="action secondary" data-pack-rename="${escapePackText(id)}">${t('catalog.rename', 'Rename')}</button><button class="action secondary" data-pack-contents="${escapePackText(id)}">${t('catalog.packViewContents', 'View contents')}</button><button class="action secondary" data-pack-delete="${escapePackText(id)}">${t('catalog.packDelete', 'Delete')}</button></div><div class="pack-row-icon">▣</div><div class="pack-row-info"><strong>${escapePackText(pack.displayName || pack.name)}</strong><small>${packMods(pack).length} ${t('catalog.packModsShort', 'mods')} · ${escapePackText(pack.fileName || '')}</small></div></article>`; }).join('')}</div>`;
  section.querySelectorAll('[data-pack-rename]').forEach((button) => button.onclick = async () => {
    const pack = findInstalledPack(button.dataset.packRename);
    const result = await showAppInputDialog({ title: t('savedPacks.renameTitle', 'Rename saved pack'), label: t('catalog.packName', 'Pack name'), value: pack?.name || '', placeholder: t('savedPacks.namePlaceholder', 'My pack'), confirmLabel: t('common.save', 'Save'), validate: (value) => !value ? t('savedPacks.validationRequired', 'Enter a pack name.') : '' });
    if (!result.confirmed || result.value === pack?.name) return;
    try { state.data = await call('mod:rename-pack', { id: button.dataset.packRename, name: result.value }); renderLibrary(); toast(t('catalog.packRenamed', 'Pack renamed.')); } catch (error) { toast(error.message); }
  });
  section.querySelectorAll('[data-pack-install]').forEach((button) => button.onclick = async () => {
    const pack = findInstalledPack(button.dataset.packInstall);
    try { state.data = await call('mod:set-enabled', { id: button.dataset.packInstall, enabled: pack?.enabled === false }); renderLibrary(); toast(pack?.enabled === false ? t('catalog.packInstalled', 'Pack installed.') : t('catalog.packDisabledState', 'Pack disabled.')); } catch (error) { toast(error.message); }
  });
  section.querySelectorAll('[data-pack-rebuild]').forEach((button) => button.onclick = async () => {
    try { state.data = await call('mod:rebuild-pack', { id: button.dataset.packRebuild }); renderLibrary(); toast(t('catalog.packRebuilt', 'Pack rebuilt.')); } catch (error) { toast(error.message); }
  });
  section.querySelectorAll('[data-pack-delete]').forEach((button) => button.onclick = async () => {
    const pack = findInstalledPack(button.dataset.packDelete);
    const confirmation = await showAppConfirmDialog({ title: t('savedPacks.deleteTitle', 'Delete saved pack'), message: formatTranslation(t('savedPacks.deleteMessage', 'Delete saved pack "{name}"?'), { name: pack?.name || t('savedPacks.defaultTitle', 'Saved pack') }), confirmLabel: t('common.delete', 'Delete'), destructive: true });
    if (!confirmation.confirmed) return;
    try { state.data = await call('library:delete-pack', { id: button.dataset.packDelete }); renderLibrary(); toast(t('catalog.packDeleted', 'Pack deleted.')); } catch (error) { toast(error.message); }
  });
  section.querySelectorAll('[data-pack-contents]').forEach((button) => button.onclick = () => showPackContents(findInstalledPack(button.dataset.packContents)));
}

const packControlsObserver = new MutationObserver(syncPackControls);
packControlsObserver.observe(document.body, { childList: true, subtree: true });
syncPackControls();
