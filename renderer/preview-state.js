function applyPreviewState() {
  const body = document.querySelector('#details .details-body');
  const title = body?.querySelector('h2')?.textContent.trim();
  if (!body || !title) return;
  const mod = state.data.mods?.find((item) => item.name === title);
  const installed = Boolean(mod && state.data.installed?.[mod.id]);
  const packName = mod && state.data.packMembership?.[mod.id];
  if (!mod || (!installed && !packName)) return;
  body.classList.add('is-installed');
  if (!body.querySelector('.details-installed-state')) {
    const node = document.createElement('div');
    node.className = 'details-installed-state';
    const russian = document.body.dataset.uiLanguage === 'ru';
    node.textContent = packName ? (russian ? `✓ Мод установлен в паке «${packName}»` : `✓ Mod is installed in “${packName}”`) : (russian ? '✓ Мод уже установлен' : '✓ Mod already installed');
    body.insertBefore(node, body.querySelector('.details-actions'));
  }
}
const previewStateObserver = new MutationObserver(applyPreviewState);
previewStateObserver.observe(document.body, { childList: true, subtree: true });
