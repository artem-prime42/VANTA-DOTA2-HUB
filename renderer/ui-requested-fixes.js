const REQUESTED_SOCIALS = [
  ['Telegram', 'https://t.me/vanta_hubx'],
  ['Discord', 'https://discord.gg/hcaQVThnmG'],
];

function requestedLanguage() { return state.data?.settings?.appLanguage === 'ru' ? 'ru' : 'en'; }
function requestedText(ru, en) { return requestedLanguage() === 'ru' ? ru : en; }

function addRequestedSettings() {
  const panel = document.querySelector('.settings-panel');
  if (!panel || panel.querySelector('.requested-socials')) return;
  const socials = document.createElement('div');
  socials.className = 'setting-row requested-socials';
  socials.innerHTML = `<div><strong>${requestedText('Социальные сети', 'Social networks')}</strong><div class="setting-value">${requestedText('Новости и поддержка проекта', 'Project news and support')}</div></div><div class="social-actions">${REQUESTED_SOCIALS.map(([name, url]) => `<a class="social-button social-${name.toLowerCase()}" href="${url}" target="_blank" rel="noreferrer">${name}</a>`).join('')}</div>`;
  panel.appendChild(socials);
}

function addModsFolderButton() {
  const host = document.querySelector('.sidebar-bottom');
  if (!host || host.querySelector('#open-mods-folder')) return;
  const button = document.createElement('button');
  button.id = 'open-mods-folder';
  button.className = 'nav-item folder-nav-item';
  button.innerHTML = `<span>▱</span>${requestedText('Папка модов', 'Mods folder')}`;
  button.onclick = async () => { try { await call('game:open-mods-folder'); } catch (error) { toast(error.message); } };
  host.prepend(button);
}

function addInstalledFileNames() {
  document.querySelectorAll('.library-mod:not(.external-file)').forEach((row) => {
    if (row.querySelector('.installed-file-name')) return;
    const id = row.querySelector('[data-library-select]')?.dataset.librarySelect;
    const record = id && (Array.isArray(state.data.installed) ? state.data.installed.find((item) => item.modId === id) : state.data.installed?.[id]);
    const fileName = record?.installedFiles?.[0];
    if (!fileName) return;
    const info = row.querySelector('.library-mod-info');
    if (!info) return;
    const label = document.createElement('small');
    label.className = 'installed-file-name';
    label.textContent = fileName;
    info.appendChild(label);
  });
}

function removeAuthorPlaceholder() {
  document.querySelectorAll('.author-profile-copy > p:not(.eyebrow)').forEach((node) => {
    if (node.textContent.trim() === 'Creator of Dota 2 cosmetic modifications.') node.remove();
  });
}

function arrangeModCardActions() {
  document.querySelectorAll('.mod-card').forEach((card) => {
    const footer = card.querySelector('.card-footer');
    const downloads = card.querySelector('.download-count');
    const action = footer?.querySelector('[data-action="install"], [data-action="update"]');
    if (!footer || !downloads || !action || footer.dataset.actionsArranged) return;
    footer.dataset.actionsArranged = '1';
    const badge = footer.querySelector('.badge') || document.createElement('span');
    action.remove();
    downloads.remove();
    footer.replaceChildren(action, badge, downloads);
  });
}

function orderHeroSlots() {
  const tabs = document.querySelector('.slot-tabs');
  if (!tabs || tabs.dataset.ordered) return;
  const buttons = [...tabs.querySelectorAll('[data-slot]')];
  const all = buttons.find((button) => button.dataset.slot === 'all');
  let set = buttons.find((button) => /set|набор/i.test(button.dataset.slot || button.textContent));
  if (!all) return;
  if (!set) {
    set = document.createElement('button');
    set.className = 'filter';
    set.dataset.slot = 'set';
    set.onclick = () => { state.heroSlot = 'set'; renderHeroDetail(); };
    tabs.appendChild(set);
  }
  tabs.dataset.ordered = '1';
  all.textContent = requestedText('Все слоты', 'All slots');
  set.textContent = requestedText('Набор', 'Set');
  [all, set, ...buttons.filter((button) => button !== all && button !== set)].forEach((button) => tabs.appendChild(button));
}

const requestedUiObserver = new MutationObserver(() => {
  addRequestedSettings();
  addModsFolderButton();
  addInstalledFileNames();
  removeAuthorPlaceholder();
  arrangeModCardActions();
  orderHeroSlots();
});
requestedUiObserver.observe(document.body, { childList: true, subtree: true });
addRequestedSettings();
addModsFolderButton();