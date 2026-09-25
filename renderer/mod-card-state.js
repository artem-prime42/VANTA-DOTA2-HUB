function applyModCardState() {
  document.querySelectorAll('.mod-card').forEach((card) => {
    const name = card.querySelector('.mod-name')?.textContent.trim();
    const mod = state.data.mods?.find((item) => item.name === name);
    if (!mod) return;
    const installed = Boolean(state.data.installed?.[mod.id]);
    const packName = state.data.packMembership?.[mod.id];
    const markedInstalled = installed || Boolean(packName);
    card.classList.toggle('is-installed', markedInstalled);
    let stateBadge = card.querySelector('.installed-state');
    if (markedInstalled && !stateBadge) {
      stateBadge = document.createElement('span');
      stateBadge.className = 'installed-state';
      const russian = document.body.dataset.uiLanguage === 'ru';
      stateBadge.title = russian ? 'Установлено' : 'Installed';
      stateBadge.textContent = '✓';
      card.appendChild(stateBadge);
    }
    if (!markedInstalled) stateBadge?.remove();
    const chips = card.querySelector('.card-chips');
    if (chips && mod.tags?.length && !chips.querySelector('.mod-tag')) {
      mod.tags.slice(0, 3).forEach((tag) => { const node = document.createElement('span'); node.className = 'mod-tag'; node.textContent = tag; chips.prepend(node); });
    }
  });
}
const modCardStateObserver = new MutationObserver(applyModCardState);
modCardStateObserver.observe(document.body, { childList: true, subtree: true });
applyModCardState();
