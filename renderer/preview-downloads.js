function alignPreviewDownloads() {
  const body = document.querySelector('#details .details-body');
  const actions = body?.querySelector('.details-actions');
  const title = body?.querySelector('h2')?.textContent.trim();
  if (!body || !actions || !title || actions.querySelector('.details-download-pill')) return;
  const mod = state.data.mods?.find((item) => item.name === title);
  if (!mod) return;
  const pill = document.createElement('span');
  pill.className = 'details-download-pill';
  const language = document.body.dataset.uiLanguage === 'ru' ? 'ru' : 'en';
  const label = language === 'ru' ? 'Скачивания' : 'Downloads';
  pill.title = `${label}: ${Number(mod.downloads || 0).toLocaleString()}`;
  pill.innerHTML = `<span class="download-icon" aria-hidden="true">&#8595;</span> ${Number(mod.downloads || 0).toLocaleString()}`;
  actions.appendChild(pill);
}
const previewDownloadsObserver = new MutationObserver(alignPreviewDownloads);
previewDownloadsObserver.observe(document.body, { childList: true, subtree: true });
