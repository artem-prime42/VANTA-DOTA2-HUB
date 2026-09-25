window.vanta.onUpdateEvent?.(handleUpdateEvent);
const state = { view: 'discover', query: '', category: 'all', section: 'heroes', lastModsSection: 'heroes', hero: '', heroQuery: '', heroSlot: 'all', heroDirectoryFilters: { attribute: 'all', rarity: 'all', tag: 'all', sort: 'all' }, author: '', authorQuery: '', authorSort: 'default', librarySelection: new Set(), update: { status: 'idle', version: null, progress: 0, error: null }, data: { mods: [], categories: [], installed: {}, favorites: [], authors: [], packs: [], savedPacks: [] } };
const CATEGORY_LABELS = new Proxy({ heroes: 'Heroes', 'hero-items': 'Hero items', herofx: 'Hero effects', 'hero-sounds': 'Hero sounds', sounds: 'Sounds', announcers: 'Announcers', music: 'Music', 'mega-kill': 'Mega-kills', terrains: 'Terrains', trees: 'Trees', river: 'River', creeps: 'Creeps', towers: 'Towers', roshan: 'Roshan', ancient: 'Ancients', tormentor: 'Tormentor', wards: 'Wards', couriers: 'Couriers', pedestal: 'Pedestals', 'creep-deny': 'Deny creeps', backgrounds: 'Menu backgrounds', huds: 'HUDs', emblems: 'Emblems', 'versus-screens': 'Versus Screen', 'item-icons': 'Item icons', ranks: 'Ranks', pings: 'Pings', cursors: 'Cursors', shaders: 'Shaders', 'ti-bp-effects': 'Effect packs', 'item-effects': 'Item effects', 'ranged-attack': 'Ranged attacks', 'high-five': 'High five', packs: 'Packs', optimization: 'Optimization', other: 'Other', sites: 'Sites' }, {
  get(target, property) {
    if (typeof property !== 'string') return Reflect.get(target, property);
    const fallback = target[property] ?? property;
    const translationMap = {
      heroes: 'catalog.filterHeroes',
      'hero-items': 'catalog.filterHeroItems',
      herofx: 'catalog.filterHeroEffects',
      'hero-sounds': 'catalog.filterHeroSounds',
      sounds: 'catalog.filterSounds',
      announcers: 'catalog.filterAnnouncers',
      music: 'catalog.filterMusic',
      'mega-kill': 'catalog.filterMegaKills',
      terrains: 'catalog.filterTerrains',
      trees: 'catalog.filterTrees',
      river: 'catalog.filterRiver',
      creeps: 'catalog.filterCreeps',
      towers: 'catalog.filterTowers',
      roshan: 'catalog.filterRoshan',
      ancient: 'catalog.filterAncient',
      tormentor: 'catalog.filterTormentor',
      wards: 'catalog.filterWards',
      couriers: 'catalog.filterCouriers',
      pedestal: 'catalog.filterPedestal',
      'creep-deny': 'catalog.filterCreepDeny',
      backgrounds: 'catalog.filterBackgrounds',
      huds: 'catalog.filterHuds',
      emblems: 'catalog.filterEmblems',
      'versus-screens': 'catalog.filterVersusScreens',
      'item-icons': 'catalog.filterItemIcons',
      ranks: 'catalog.filterRanks',
      pings: 'catalog.filterPings',
      cursors: 'catalog.filterCursors',
      shaders: 'catalog.filterShaders',
      'ti-bp-effects': 'catalog.filterTiBpEffects',
      'item-effects': 'catalog.filterItemEffects',
      'ranged-attack': 'catalog.filterRangedAttack',
      'high-five': 'catalog.filterHighFive',
      packs: 'catalog.filterPacks',
      optimization: 'catalog.filterOptimization',
      other: 'catalog.filterOther',
      sites: 'catalog.filterSites'
    };
    return translationMap[property] ? t(translationMap[property], fallback) : fallback;
  }
});
const HERO_PORTRAIT_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';
const HERO_PORTRAIT_ALIASES = { 'anti mage': 'antimage', 'anti-mage': 'antimage', anti_mage: 'antimage', clockwerk: 'rattletrap', doom: 'doom_bringer', io: 'wisp', lifestealer: 'life_stealer', magnus: 'magnataur', 'nature prophet': 'furion', necrophos: 'necrolyte', outworld_devourer: 'obsidian_destroyer', 'outworld devourer': 'obsidian_destroyer', 'queen of pain': 'queenofpain', 'shadow fiend': 'nevermore', timbersaw: 'shredder', 'treant protector': 'treant', underlord: 'abyssal_underlord', 'vengeful spirit': 'vengefulspirit', wraith_king: 'skeleton_king', windranger: 'windrunner', zeus: 'zuus' };
const HERO_ID_TO_KEY = { 1: 'anti_mage', 2: 'axe', 3: 'bane', 4: 'bloodseeker', 5: 'crystal_maiden', 6: 'drow_ranger', 7: 'earthshaker', 8: 'juggernaut', 9: 'mirana', 10: 'morphling', 11: 'shadow_fiend', 12: 'phantom_lancer', 13: 'puck', 14: 'pudge', 15: 'razor', 16: 'sand_king', 17: 'storm_spirit', 18: 'sven', 19: 'tiny', 20: 'vengeful_spirit', 21: 'windranger', 22: 'zeus', 23: 'kunkka', 25: 'lina', 26: 'lion', 27: 'shadow_shaman', 28: 'slardar', 29: 'tidehunter', 30: 'witch_doctor', 31: 'lich', 32: 'riki', 33: 'enigma', 34: 'tinker', 35: 'sniper', 36: 'necrophos', 37: 'warlock', 38: 'beastmaster', 39: 'queen_of_pain', 40: 'venomancer', 41: 'faceless_void', 42: 'wraith_king', 43: 'death_prophet', 44: 'phantom_assassin', 45: 'pugna', 46: 'templar_assassin', 47: 'viper', 48: 'luna', 49: 'dragon_knight', 50: 'dazzle', 51: 'clockwerk', 52: 'leshrac', 53: 'nature_prophet', 54: 'lifestealer', 55: 'dark_seer', 56: 'clinkz', 57: 'omniknight', 58: 'enchantress', 59: 'huskar', 60: 'night_stalker', 61: 'broodmother', 62: 'bounty_hunter', 63: 'weaver', 64: 'jakiro', 65: 'batrider', 66: 'chen', 67: 'spectre', 68: 'ancient_apparition', 69: 'doom', 70: 'ursa', 71: 'spirit_breaker', 72: 'gyrocopter', 73: 'alchemist', 74: 'invoker', 75: 'silencer', 76: 'outworld_devourer', 77: 'lycan', 78: 'brewmaster', 79: 'shadow_demon', 80: 'lone_druid', 81: 'chaos_knight', 82: 'meepo', 83: 'treant_protector', 84: 'ogre_magi', 85: 'undying', 86: 'rubick', 87: 'disruptor', 88: 'nyx_assassin', 89: 'naga_siren', 90: 'keeper_of_the_light', 91: 'io', 92: 'visage', 93: 'slark', 94: 'medusa', 95: 'troll_warlord', 96: 'centaur', 97: 'magnus', 98: 'timbersaw', 99: 'bristleback', 100: 'tusk', 101: 'skywrath_mage', 102: 'abaddon', 103: 'elder_titan', 104: 'legion_commander', 105: 'techies', 106: 'ember_spirit', 107: 'earth_spirit', 108: 'underlord', 109: 'terrorblade', 110: 'phoenix', 111: 'oracle', 112: 'winter_wyvern', 113: 'arc_warden', 114: 'monkey_king', 119: 'dark_willow', 120: 'pangolier', 121: 'grimstroke', 123: 'hoodwink', 126: 'void_spirit', 128: 'snapfire', 129: 'mars', 131: 'ringmaster', 135: 'dawnbreaker', 136: 'marci', 137: 'primal_beast', 138: 'muerta', 145: 'kez', 155: 'largo' };
function normalizeHeroId(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return HERO_ID_TO_KEY[Number(raw)] || raw;
  const aliases = {
    'anti mage': 'anti_mage', 'anti-mage': 'anti_mage', antimage: 'anti_mage',
    'nature prophet': 'nature_prophet', "nature's prophet": 'nature_prophet', 'natures prophet': 'nature_prophet', furion: 'nature_prophet',
    'outworld devourer': 'outworld_devourer', 'outworld-devourer': 'outworld_devourer', 'outworld destroyer': 'outworld_devourer', 'outworld-destroyer': 'outworld_devourer', outworld_destroyer: 'outworld_devourer', 'obsidian destroyer': 'outworld_devourer', 'obsidian-destroyer': 'outworld_devourer', obsidian_destroyer: 'outworld_devourer',
    'queen of pain': 'queen_of_pain', 'queen-of-pain': 'queen_of_pain', queenofpain: 'queen_of_pain',
    'shadow fiend': 'shadow_fiend', 'shadow-fiend': 'shadow_fiend', nevermore: 'shadow_fiend',
    'treant protector': 'treant_protector', 'treant-protector': 'treant_protector',
    'vengeful spirit': 'vengeful_spirit', 'vengeful-spirit': 'vengeful_spirit', vengefulspirit: 'vengeful_spirit',
    windrunner: 'windranger', 'rattletrap': 'clockwerk', wisp: 'io', 'life stealer': 'lifestealer', 'life-stealer': 'lifestealer', magnataur: 'magnus', 'abyssal underlord': 'underlord', 'abyssal-underlord': 'underlord', shredder: 'timbersaw',
  };
  return aliases[raw] || raw.replace(/['’.-]+/g, ' ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function heroPortraitId(hero) { const value = normalizeHeroId(hero); return HERO_PORTRAIT_ALIASES[value] || value; }
const $ = (selector) => document.querySelector(selector);
const call = async (channel, payload) => { const response = await window.vanta.call(channel, payload); if (!response.ok) throw new Error(response.error); return response.data; };
function toast(message) { const node = $('#toast'); if (!node) return; node.textContent = message; node.classList.add('show'); setTimeout(() => node.classList.remove('show'), 3500); }
function renderUpdatePanel() {
  const panel = $('#update-panel');
  if (!panel) return;
  const update = state.update;
  if (!['available', 'downloading', 'downloaded', 'error'].includes(update.status)) { panel.hidden = true; panel.innerHTML = ''; return; }
  const version = escapeHtml(update.version || '');
  const copy = update.status === 'available'
    ? `<strong>${t('update.availableTitle', 'Update available')}</strong><p>${formatTranslation(t('update.availableMessage', 'VANTA {version} is ready.'), { version })}</p><div class="update-actions"><button class="action" data-update-download>${t('update.download', 'Update')}</button><button class="action secondary" data-update-later>${t('update.later', 'Later')}</button></div>`
    : update.status === 'downloading'
      ? `<strong>${t('update.downloadingTitle', 'Updating VANTA')}</strong><p>${t('update.downloadingMessage', 'Downloading the new version...')}</p><div class="update-progress"><span style="width:${Math.max(0, Math.min(100, Number(update.progress) || 0))}%"></span></div><small>${Math.round(update.progress || 0)}%</small>`
      : update.status === 'downloaded'
        ? `<strong>${t('update.readyTitle', 'Update ready')}</strong><p>${formatTranslation(t('update.readyMessage', 'VANTA {version} is ready to install.'), { version })}</p><div class="update-actions"><button class="action" data-update-install>${t('update.restart', 'Restart and update')}</button><button class="action secondary" data-update-later>${t('update.later', 'Later')}</button></div>`
        : `<strong>${t('update.errorTitle', 'VANTA update failed')}</strong><p>${escapeHtml(update.error || t('update.errorMessage', 'The update could not be completed.'))}</p><div class="update-actions"><button class="action" data-update-retry>${t('update.retry', 'Retry')}</button><button class="action secondary" data-update-later>${t('update.later', 'Later')}</button></div>`;
  panel.innerHTML = copy;
  panel.hidden = false;
  panel.querySelector('[data-update-download]')?.addEventListener('click', () => call('update:download'));
  panel.querySelector('[data-update-install]')?.addEventListener('click', () => call('update:install'));
  panel.querySelector('[data-update-retry]')?.addEventListener('click', () => call('update:check', { manual: true }));
  panel.querySelector('[data-update-later]')?.addEventListener('click', () => { panel.hidden = true; });
}
function handleUpdateEvent(update) { state.update = { ...state.update, ...update }; renderUpdatePanel(); }
function closeAnimatedDialog(dialog, payload, resolve) {
  if (!dialog.open || dialog.classList.contains('is-closing')) return;
  dialog.classList.add('is-closing');
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    dialog.removeEventListener('animationend', finish);
    dialog.close();
    dialog.remove();
    resolve(payload);
  };
  dialog.addEventListener('animationend', finish);
  setTimeout(finish, 220);
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function showAppInputDialog({ title, message = '', label = '', value = '', placeholder = '', confirmLabel = t('common.save', 'Save'), cancelLabel = t('common.cancel', 'Cancel'), maxLength = 80, validate = () => '' }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-modal-dialog';
    dialog.innerHTML = `
      <form class="app-modal-form" method="dialog">
        <div class="app-modal-header">
          <h2>${escapeHtml(title || '')}</h2>
          <button type="button" class="dialog-close app-modal-close" aria-label="${escapeHtml(t('common.close', 'Close'))}">×</button>
        </div>
        ${message ? `<p class="app-modal-message">${escapeHtml(message)}</p>` : ''}
        ${label ? `<label class="app-modal-label" for="app-modal-input">${escapeHtml(label)}</label>` : ''}
        <input id="app-modal-input" class="app-modal-input" type="text" value="${escapeHtml(value)}" maxlength="${Number.isFinite(maxLength) ? maxLength : 80}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false" />
        <div class="app-modal-error" role="alert" hidden></div>
        <div class="app-modal-actions">
          <button type="button" class="action secondary app-modal-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="submit" class="action app-modal-submit">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>
    `;
    const input = dialog.querySelector('#app-modal-input');
    const form = dialog.querySelector('.app-modal-form');
    const error = dialog.querySelector('.app-modal-error');
    const closeDialog = (payload) => closeAnimatedDialog(dialog, payload, resolve);
    const cancel = () => closeDialog({ confirmed: false, value: null });
    const submit = () => {
      const nextValue = input.value.trim();
      const issue = validate(nextValue);
      if (issue) {
        error.textContent = issue;
        error.hidden = false;
        input.focus({ preventScroll: true });
        return;
      }
      closeDialog({ confirmed: true, value: nextValue });
    };
    form.querySelector('.app-modal-close').onclick = cancel;
    form.querySelector('.app-modal-cancel').onclick = cancel;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });
    dialog.addEventListener('close', () => { if (!dialog.classList.contains('is-closing')) dialog.remove(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) cancel(); });
    dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } });
    document.body.appendChild(dialog);
    dialog.showModal();
    input.focus({ preventScroll: true });
    if (value) { input.setSelectionRange(value.length, value.length); }
  });
}
function showAppConfirmDialog({ title, message = '', confirmLabel = t('common.delete', 'Delete'), cancelLabel = t('common.cancel', 'Cancel'), destructive = false }) {
  return new Promise((resolve) => {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-modal-dialog app-modal-confirm';
    dialog.innerHTML = `
      <form class="app-modal-form" method="dialog">
        <div class="app-modal-header">
          <h2>${escapeHtml(title || '')}</h2>
          <button type="button" class="dialog-close app-modal-close" aria-label="${escapeHtml(t('common.close', 'Close'))}">×</button>
        </div>
        ${message ? `<p class="app-modal-message">${escapeHtml(message)}</p>` : ''}
        <div class="app-modal-actions">
          <button type="button" class="action secondary app-modal-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="submit" class="action ${destructive ? 'danger' : ''} app-modal-submit">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>
    `;
    const form = dialog.querySelector('.app-modal-form');
    const closeDialog = (payload) => closeAnimatedDialog(dialog, payload, resolve);
    const cancel = () => closeDialog({ confirmed: false });
    form.querySelector('.app-modal-close').onclick = cancel;
    form.querySelector('.app-modal-cancel').onclick = cancel;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      closeDialog({ confirmed: true });
    });
    dialog.addEventListener('close', () => { if (!dialog.classList.contains('is-closing')) dialog.remove(); });
    dialog.addEventListener('click', (event) => { if (event.target === dialog) cancel(); });
    dialog.addEventListener('keydown', (event) => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } });
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}
window.showAppInputDialog = showAppInputDialog;
window.showAppConfirmDialog = showAppConfirmDialog;

function i18nKey(key, fallback) { return t(key, fallback); }
function slotLabel(slot) {
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
    'off_hand': 'slot.offhand',
    armor: 'slot.armor',
    armour: 'slot.armor'
  };
  return t(map[normalized] || map[raw.toLowerCase()] || normalized, normalized.replace(/\s+/g, ' '));
}
function isVideoPreview(url) { return /\.(?:mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(String(url || '')); }
function showPreview(url, title = t('catalog.preview', 'Preview'), poster = '') { if (!isVideoPreview(url)) return; const dialog = $('#video-preview'); const content = $('#video-preview-content'); if (!dialog || !content) return; content.replaceChildren(); const heading = document.createElement('h2'); heading.textContent = title; const frame = document.createElement('div'); frame.className = 'video-preview-frame'; const video = document.createElement('video'); video.controls = true; video.setAttribute('controls', ''); video.autoplay = true; video.playsInline = true; video.setAttribute('playsinline', ''); video.preload = 'auto'; video.style.width = '100%'; video.style.height = '100%'; video.style.maxHeight = '70vh'; video.style.objectFit = 'contain'; video.style.pointerEvents = 'auto'; if (poster) video.poster = poster; const source = document.createElement('source'); source.src = url; source.type = /\.webm(?:[?#].*)?$/i.test(url) ? 'video/webm' : 'video/mp4'; const status = document.createElement('p'); status.className = 'video-preview-status'; status.textContent = t('catalog.videoLoading'); video.append(source); frame.append(video); content.append(heading, frame, status); video.addEventListener('loadeddata', () => { status.remove(); video.play().catch(() => {}); }, { once: true }); video.addEventListener('error', () => { status.textContent = t('catalog.videoError'); }); dialog.showModal(); video.load(); }
function bindPreviewButtons() { document.querySelectorAll('[data-preview-url]').forEach((button) => { button.onclick = () => showPreview(button.dataset.previewUrl, button.dataset.previewTitle || t('catalog.preview', 'Preview')); }); }
function setTitle() { const title = $('#page-title'); if (title) title.textContent = ({ discover: t('nav.home'), mods: t('nav.mods'), installed: t('nav.library'), 'saved-packs': t('nav.savedPacks', 'Packs'), authors: t('nav.authors'), guides: t('nav.guides'), 'hero-grids': t('nav.heroGrids', 'Hero Grids'), settings: t('nav.settings') })[state.view]; const search = $('.topbar .search'); if (search) { search.classList.toggle('settings-hidden', state.view === 'settings' || state.view === 'hero-grids'); const searchInput = search.querySelector('input'); const searchKey = state.view === 'saved-packs' ? 'search.packs.placeholder' : state.view === 'installed' ? 'search.library.placeholder' : 'search.placeholder'; searchInput?.setAttribute('data-i18n-placeholder', searchKey); searchInput?.setAttribute('placeholder', t(searchKey)); } document.querySelectorAll('.top-tab').forEach((tab) => tab.classList.toggle('active', state.view === 'mods' && tab.dataset.top === state.section)); }
async function loadCatalog() {
  const focusedSearch = document.activeElement?.id === 'search';
  const searchSelection = focusedSearch ? { start: $('#search').selectionStart, end: $('#search').selectionEnd } : null;
  const restoreSearchFocus = () => {
    if (!focusedSearch) return;
    const input = $('#search');
    if (!input) return;
    input.focus({ preventScroll: true });
    if (searchSelection) input.setSelectionRange(searchSelection.start, searchSelection.end);
  };
  const requestedView = state.view;
  const requestedSection = state.section;
  const requestedQuery = state.view === 'authors' ? state.authorQuery : state.view === 'mods' && state.hero ? state.heroQuery : state.query;
  setTitle();
  $('#content').innerHTML = `<div class="empty"><strong>${t('catalog.loading')}</strong>${t('catalog.syncingMetadata', 'Syncing lightweight metadata from GitHub...')}</div>`;

  if (state.view === 'saved-packs') {
    try {
      const data = await call('saved-packs:list');
      if (state.view !== requestedView) return;
      state.data = data;
      render();
      restoreSearchFocus();
      return;
    } catch (error) {
      if (state.view !== requestedView) return;
      $('#content').innerHTML = `<div class="error"><strong>${t('catalog.unavailable')}</strong>${error.message}</div>`;
      return;
    }
  }

  try {
    const data = state.view === 'installed' ? await call('library:get') : await call('catalog:list', { query: state.view === 'authors' ? state.authorQuery : state.view === 'mods' && state.hero ? state.heroQuery : state.query, category: state.view === 'authors' || state.view === 'mods' && state.hero ? 'all' : state.category, section: state.view === 'authors' || state.view === 'mods' && state.hero ? 'all' : state.section, author: state.view === 'authors' ? state.author : '', hero: state.view === 'mods' && state.hero ? state.hero : '' });
    if (state.view !== requestedView || state.section !== requestedSection || (state.view === 'authors' ? state.authorQuery : state.view === 'mods' && state.hero ? state.heroQuery : state.query) !== requestedQuery) return;
    state.data = data;
    updateGameStatus(state.data.gamePath);
    render();
    restoreSearchFocus();
    if (state.data.meta?.offline) toast(t('catalog.offlineToast'));
  } catch (error) {
    if (state.view !== requestedView) return;
    $('#content').innerHTML = `<div class="error"><strong>${t('catalog.unavailable')}</strong>${error.message}<br><br>${t('catalog.tryAgain')}</div>`;
  }
}
async function refreshCatalogAutomatically() { try { const refreshed = await call('catalog:refresh'); if (state.view === 'installed') { state.data = { ...state.data, ...refreshed }; render(); } else await loadCatalog(); } catch { /* Keep the current catalog when the network is unavailable. */ } }
function updateGameStatus(gamePath) { const text = gamePath ? formatTranslation(t('catalog.gameReadyWithPath', 'Dota 2 ready · {path}'), { path: gamePath }) : t('catalog.gameMissing', 'Dota 2 not found — set the path in settings'); const status = $('#status-text'); const dot = $('#status-dot'); const sidebarText = $('#sidebar-status-text'); const sidebarDot = $('#sidebar-status-dot'); if (status) status.textContent = text; if (dot) dot.classList.toggle('ready', Boolean(gamePath)); if (sidebarText) sidebarText.textContent = gamePath ? t('status.dotaReady', 'Dota 2 ready') : t('status.dotaMissing', 'Dota 2 not found'); if (sidebarDot) sidebarDot.classList.toggle('ready', Boolean(gamePath)); }
function renderSavedPacks() {
  const packs = state.data.savedPacks || [];
  if (!packs.length) {
    $('#content').innerHTML = `<div class="empty"><strong>${t('savedPacks.emptyTitle', 'No saved packs yet')}</strong>${t('savedPacks.emptyHint', 'Save a pack from the library to keep a reusable preset.')}</div>`;
    return;
  }
  $('#content').innerHTML = `<div class="saved-packs-panel"><div class="library-header"><div><p class="eyebrow">${t('savedPacks.title', 'Saved packs')}</p><p>${t('savedPacks.subtitle', 'Reusable pack presets saved from the library.')}</p></div></div><div class="saved-pack-list">${packs.map((pack) => `<article class="library-mod saved-pack-item"><div class="library-thumb-empty">▣</div><div class="library-mod-info"><strong>${libraryEscape(pack.name)}</strong><small>${formatTranslation(t('savedPacks.modCount', '{count} mods'), { count: pack.modCount || 0 })}</small><small>${pack.active ? t('savedPacks.alreadyActive', 'Already active') : t('savedPacks.inactive', 'Inactive')}${pack.activeFileName ? ` · ${libraryEscape(pack.activeFileName)}` : ''}</small></div><div class="library-mod-actions"><button class="action ${pack.active ? 'secondary' : ''}" data-saved-pack-activate="${libraryEscape(pack.id)}" ${pack.active ? 'disabled' : ''}>${pack.active ? t('savedPacks.alreadyActive', 'Already active') : t('savedPacks.activate', 'Activate')}</button><button class="action secondary" data-saved-pack-contents="${libraryEscape(pack.id)}">${t('savedPacks.viewContents', 'View contents')}</button><button class="action secondary" data-saved-pack-rename="${libraryEscape(pack.id)}">${t('catalog.rename', 'Rename')}</button><button class="action secondary" data-saved-pack-delete="${libraryEscape(pack.id)}">${t('catalog.delete', 'Delete')}</button></div></article>`).join('')}</div></div>`;
  document.querySelectorAll('[data-saved-pack-activate]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.savedPackActivate;
      try {
        state.data = await call('saved-packs:activate', { id });
        render();
        toast(t('savedPacks.activated', 'Saved pack activated.'));
      } catch (error) { toast(error.message); }
    };
  });
  document.querySelectorAll('[data-saved-pack-contents]').forEach((button) => {
    button.onclick = async () => {
      try { showUnifiedPackContents(await call('saved-packs:contents', { id: button.dataset.savedPackContents })); }
      catch (error) { toast(/missing/i.test(error.message) ? t('savedPacks.fileMissing', 'Saved pack file was not found.') : t('savedPacks.viewerError', 'Could not open pack contents.')); }
    };
  });
  document.querySelectorAll('[data-saved-pack-rename]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.savedPackRename;
      const current = (state.data.savedPacks || []).find((pack) => String(pack.id) === String(id));
      const result = await showAppInputDialog({
        title: t('savedPacks.renameTitle', 'Rename saved pack'),
        label: t('savedPacks.renamePrompt', 'Pack name'),
        value: current?.name || '',
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
        state.data = await call('saved-packs:rename', { id, name: result.value });
        render();
      } catch (error) { toast(error.message); }
    };
  });
  document.querySelectorAll('[data-saved-pack-delete]').forEach((button) => {
    button.onclick = async () => {
      const id = button.dataset.savedPackDelete;
      const pack = (state.data.savedPacks || []).find((item) => String(item.id) === String(id));
      const result = await showAppConfirmDialog({
        title: t('savedPacks.deleteTitle', 'Delete saved pack'),
        message: formatTranslation(t('savedPacks.deleteMessage', 'Delete saved pack "{name}"?'), { name: pack?.name || t('savedPacks.defaultTitle', 'Saved pack') }),
        confirmLabel: t('common.delete', 'Delete'),
        destructive: true,
      });
      if (!result.confirmed) return;
      try {
        state.data = await call('saved-packs:delete', { id });
        render();
      } catch (error) { toast(error.message); }
    };
  });
}

function render() { setTitle(); if (state.view === 'settings') return renderSettings(); if (state.view === 'authors') return renderAuthors(); if (state.view === 'installed') return renderLibrary(); if (state.view === 'saved-packs') return renderSavedPacks(); if (state.view === 'mods' && state.section === 'heroes') return state.hero ? renderHeroDetail() : renderHeroDirectory(); const categories = state.data.categories || []; const mods = state.data.mods || []; if (state.view === 'discover') { $('#content').innerHTML = renderFeatured(mods) + renderRecent(mods); bindFeatured(); bindCardLinks(); document.querySelectorAll('[data-action]').forEach((node) => node.onclick = () => action(node.dataset.action, node.dataset.id)); const more = $('#recent-more'); if (more) more.onclick = () => { document.querySelector('.recent-more-items')?.classList.remove('hidden'); more.remove(); }; return; } const filter = `<div class="toolbar"><div class="filters"><button class="filter ${state.category === 'all' ? 'active' : ''}" data-category="all">${t('catalog.allMods', 'All mods')}</button>${categories.map((category) => `<button class="filter ${state.category === category ? 'active' : ''}" data-category="${category}">${CATEGORY_LABELS[category] || category}</button>`).join('')}</div><span class="result-count">${formatTranslation(t('catalog.heroModsCount', '{count} mods'), { count: mods.length })}</span></div>`; const cards = mods.length ? `<div class="mod-grid">${mods.map(card).join('')}</div>` : `<div class="empty"><strong>${t('catalog.empty', 'Nothing here yet')}</strong>${t('catalog.emptyHint', 'Try another search or category.')}</div>`; $('#content').innerHTML = filter + cards; document.querySelectorAll('[data-category]').forEach((node) => node.onclick = () => { state.category = node.dataset.category; loadCatalog(); }); document.querySelectorAll('[data-action]').forEach((node) => node.onclick = () => action(node.dataset.action, node.dataset.id)); }
function renderLibrary() { const installed = Object.values(state.data.installed || {}); const groups = { packs: [], heroes: [], heroSounds: [], world: [], interface: [], effects: [], other: [] }; const categoryGroup = (category, mod) => mod.type === 'pack' || category === 'packs' ? 'packs' : ['heroes', 'hero-items', 'herofx'].includes(category) ? 'heroes' : category === 'hero-sounds' ? 'heroSounds' : ['terrains', 'trees', 'river', 'creeps', 'towers', 'roshan', 'ancient', 'tormentor', 'wards', 'couriers', 'pedestal', 'creep-deny'].includes(category) ? 'world' : ['backgrounds', 'huds', 'emblems', 'versus-screens', 'item-icons', 'ranks', 'pings', 'cursors'].includes(category) ? 'interface' : ['shaders', 'ti-bp-effects', 'item-effects', 'ranged-attack', 'high-five'].includes(category) ? 'effects' : 'other'; installed.forEach((mod) => groups[categoryGroup(mod.categoryId, mod)].push(mod)); const labels = { packs: t('catalog.filterPacks', 'Packs'), heroes: t('catalog.filterHeroes', 'Heroes'), heroSounds: t('catalog.filterHeroes', 'Hero sounds'), world: t('catalog.filterWorld', 'World'), interface: t('catalog.filterInterface', 'Interface'), effects: t('catalog.filterEffects', 'Effects'), other: t('catalog.filterOther', 'Other') }; const selected = state.librarySelection; const row = (mod) => `<article class="library-mod ${selected.has(mod.modId) ? 'selected' : ''}"><label class="library-check"><input type="checkbox" data-library-select="${mod.modId}" ${selected.has(mod.modId) ? 'checked' : ''}><span></span></label>${mod.previewUrl ? `<img src="${mod.previewUrl}" loading="lazy" alt="">` : '<div class="library-thumb-empty">◈</div>'}<div class="library-mod-info"><strong>${mod.name || mod.modId}</strong><small>${CATEGORY_LABELS[mod.categoryId] || mod.categoryId}${mod.heroLabel ? ` · ${mod.heroLabel}` : ''}${mod.slot ? ` · ${slotLabel(mod.slot)}` : ''}</small><small>${mod.enabled === false ? t('catalog.actionDisabled', 'Disabled') : t('catalog.actionEnabled', 'Enabled')} · ${formatModDate(mod.installedAt)}</small></div><div class="library-mod-actions"><button class="toggle-button ${mod.enabled !== false ? 'on' : ''}" data-library-toggle="${mod.modId}">${mod.enabled !== false ? t('catalog.actionEnabled', 'Enabled') : t('catalog.actionDisabled', 'Disabled')}</button><button class="action secondary" data-library-remove="${mod.modId}">${t('catalog.uninstall', 'Remove')}</button></div></article>`; const sections = Object.entries(groups).filter(([, mods]) => mods.length).map(([id, mods]) => `<section class="library-section"><div class="library-section-heading"><h2>${labels[id]}</h2><span>${mods.length}</span></div><div class="library-mod-list">${mods.map(row).join('')}</div></section>`).join(''); const packs = state.data.packs || []; $('#content').innerHTML = `<div class="library-header"><div><p class="eyebrow">LOCAL LIBRARY</p><h2>Installed mods</h2><p>Manage ownership, enabled state and saved mod packs.</p></div><div class="library-header-actions"><button class="action secondary" id="library-select-all">Select all</button><button class="action" id="library-pack">Create pack</button></div></div><div class="library-bulk"><span>${selected.size} selected</span><button class="action secondary" id="library-enable-selected" ${selected.size ? '' : 'disabled'}>Enable selected</button><button class="action secondary" id="library-disable-selected" ${selected.size ? '' : 'disabled'}>Disable selected</button><button class="action secondary" id="library-remove-selected" ${selected.size ? '' : 'disabled'}>Remove selected</button></div>${sections || '<div class="empty"><strong>Library is empty</strong>Install a mod from Mods to see it here.</div>'}${packs.length ? `<section class="library-section packs-section"><div class="library-section-heading"><h2>Packs</h2><span>${packs.length}</span></div>${packs.map((pack) => `<div class="pack-row"><strong>${pack.name}</strong><span>${pack.modIds.length} mods</span><button class="action secondary" data-pack-delete="${pack.id}">Delete</button></div>`).join('')}</section>` : ''}`; bindLibrary(); renderExternalFiles(); syncLibraryBulkUi(); }
function bindLibrary() { document.querySelectorAll('[data-library-select]').forEach((input) => input.onchange = () => { input.checked ? state.librarySelection.add(input.dataset.librarySelect) : state.librarySelection.delete(input.dataset.librarySelect); renderLibrary(); }); document.querySelectorAll('[data-library-toggle]').forEach((button) => button.onclick = async () => { state.data = await call('mod:set-enabled', { id: button.dataset.libraryToggle, enabled: button.textContent.trim() !== t('catalog.actionEnabled', 'Enabled') }); renderLibrary(); }); document.querySelectorAll('[data-library-remove]').forEach((button) => button.onclick = async () => { const confirmation = await showAppConfirmDialog({ title: t('catalog.removeInstalledModTitle', 'Remove mod'), message: t('catalog.removeInstalledMod', 'Remove this installed mod?'), confirmLabel: t('catalog.uninstall', 'Uninstall'), destructive: true }); if (!confirmation.confirmed) return; state.data = await call('mod:uninstall', { id: button.dataset.libraryRemove }); state.librarySelection.delete(button.dataset.libraryRemove); renderLibrary(); }); $('#library-select-all').onclick = () => { const entries = Array.isArray(state.data.installed) ? state.data.installed : Object.values(state.data.installed || {}); entries.forEach((item) => state.librarySelection.add(item?.id || item?.modId)); renderLibrary(); }; $('#library-pack').onclick = async () => { const entries = Array.isArray(state.data.installed) ? state.data.installed : Object.values(state.data.installed || {}); const validIds = new Set(entries.map((item) => item?.id || item?.modId).filter(Boolean)); const ids = [...state.librarySelection].filter((id) => validIds.has(id)); if (!ids.length) return toast(t('catalog.selectModsFirst', 'Select mods first.')); state.librarySelection = new Set(ids); const result = await showAppInputDialog({ title: t('savedPacks.saveTitle', 'Save pack'), label: t('catalog.packName', 'Pack name'), placeholder: t('savedPacks.namePlaceholder', 'My pack'), confirmLabel: t('common.save', 'Save'), validate: (value) => { if (!value) return t('savedPacks.validationRequired', 'Enter a pack name.'); if (value.length > 80) return t('savedPacks.validationTooLong', 'Pack name is too long.'); return ''; } }); if (!result.confirmed) return; state.data = await call('library:save-pack', { name: result.value, modIds: ids }); state.librarySelection.clear(); renderLibrary(); toast(t('catalog.packSaved', 'Pack saved.')); }; $('#library-enable-selected').onclick = () => bulkLibrarySet(true); $('#library-disable-selected').onclick = () => bulkLibrarySet(false); $('#library-remove-selected').onclick = async () => { const ids = [...state.librarySelection]; if (!ids.length) return toast(t('catalog.selectModsFirst', 'Select mods first.')); const confirmation = await showAppConfirmDialog({ title: t('catalog.removeSelectedModsTitle', 'Remove selected mods'), message: formatTranslation(t('catalog.removeSelectedMods', 'Remove {count} selected mod(s)?'), { count: ids.length }), confirmLabel: t('catalog.uninstall', 'Uninstall'), destructive: true }); if (!confirmation.confirmed) return; for (const id of ids) await call('mod:uninstall', { id }); state.librarySelection.clear(); await loadCatalog(); }; document.querySelectorAll('[data-pack-delete]').forEach((button) => button.onclick = async () => { state.data = await call('library:delete-pack', { id: button.dataset.packDelete }); renderLibrary(); }); }
async function bulkLibrarySet(enabled) { for (const id of state.librarySelection) await call('mod:set-enabled', { id, enabled }); state.data = await call('library:get'); renderLibrary(); }
function renderExternalFiles() { const files = state.data.external || []; if (!files.length) return; const section = document.createElement('section'); section.className = 'library-section external-files-section'; section.innerHTML = `<div class="library-section-heading"><h2>${t('catalog.externalFiles')}</h2><span>${files.length}</span></div><p class="external-note">${t('catalog.externalFilesNote')}</p><div class="library-mod-list">${files.map((file) => `<article class="library-mod external-file"><img src="${file.previewUrl || ''}" loading="lazy" alt=""><div class="library-mod-info"><strong>${file.fileName}</strong><small>${file.category}${file.heroLabel ? ` · ${file.heroLabel}` : ''}</small><small>${(file.size / 1024 / 1024).toFixed(1)} MB · ${file.relativePath}</small></div><span class="external-badge">${t('catalog.externalBadge')}</span></article>`).join('')}</div>`; $('#content').appendChild(section); }
function renderRecent(mods) { const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); const recent = [...mods].filter((mod) => { const date = Date.parse(mod.createdAt || ''); return Number.isFinite(date) && date >= cutoff; }).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)); const first = recent.slice(0, 6); const remaining = recent.slice(6); if (!recent.length) return ''; const moreLabel = t('catalog.more', 'More'); return `<section class="recent-section"><div class="recent-heading"><div><p class="eyebrow">${t('catalog.recentlyAddedBadge', 'LAST 7 DAYS')}</p><h2>${t('catalog.recentlyAdded', 'Recently added')}</h2></div><span>${formatTranslation(t('catalog.recentCount', '{count} new mods'), { count: recent.length })}</span></div><div class="mod-grid recent-grid">${first.map(card).join('')}</div>${remaining.length ? `<div class="mod-grid recent-more-items hidden">${remaining.map(card).join('')}</div><button id="recent-more" class="recent-more">${moreLabel}</button>` : ''}</section>`; }
function renderHeroDirectory() { const heroes = new Map(); for (const mod of state.data.mods || []) { const id = normalizeHeroId(mod.hero || mod.heroId || mod.heroName || mod.heroLabel); if (!id) continue; const entry = heroes.get(id) || { id, label: mod.heroLabel || id.replace(/_/g, ' '), count: 0 }; entry.count += 1; entry.label = mod.heroLabel || entry.label; heroes.set(id, entry); } const list = [...heroes.values()].sort((left, right) => left.label.localeCompare(right.label)); $('#content').innerHTML = `<div class="hero-directory-head"><div><p class="eyebrow">${t('catalog.authorIntro')}</p><h2>${t('catalog.chooseHero')}</h2><p>${t('catalog.heroDirectoryDesc')}</p></div><span class="result-count">${formatTranslation(t('catalog.heroBadges', '{count} heroes'), { count: list.length })}</span></div><div class="hero-grid">${list.map((hero) => `<button class="hero-card" data-hero="${hero.id}"><img src="${HERO_PORTRAIT_BASE}${heroPortraitId(hero.id)}.png" alt="${hero.label}"><span class="hero-card-shade"></span><span class="hero-card-copy"><strong>${hero.label}</strong><small>${formatTranslation(t('catalog.heroModsCount', '{count} mods'), { count: hero.count })}</small></span></button>`).join('')}</div>`; document.querySelectorAll('[data-hero]').forEach((node) => node.onclick = () => { state.hero = node.dataset.hero; state.heroSlot = 'all'; state.heroQuery = ''; loadCatalog(); }); }
function renderHeroDetail() { const heroMods = state.data.mods.filter((mod) => !state.heroSlot || state.heroSlot === 'all' || mod.slot === state.heroSlot); const heroLabel = heroMods[0]?.heroLabel || state.hero.replace(/_/g, ' '); const slots = [...new Set(state.data.mods.map((mod) => mod.slot).filter(Boolean))]; $('#content').innerHTML = `<button class="back-link" id="hero-back">← ${t('catalog.backToHeroes')}</button><section class="hero-detail"><div class="hero-detail-head"><div><p class="eyebrow">${t('catalog.heroLoadout').toUpperCase()}</p><h2>${heroLabel}</h2><p>${t('catalog.heroLoadoutDesc')}</p></div><span class="badge">${formatTranslation(t('catalog.heroModsCount', '{count} mods'), { count: state.data.mods.length })}</span></div><div class="slot-tabs"><button class="filter ${state.heroSlot === 'all' ? 'active' : ''}" data-slot="all">${t('catalog.allSlots')}</button>${slots.map((slot) => `<button class="filter ${state.heroSlot === slot ? 'active' : ''}" data-slot="${slot}">${slotLabel(slot)}</button>`).join('')}</div><label class="hero-search"><span>⌕</span><input id="hero-search" type="search" data-i18n-placeholder="search.hero.placeholder" placeholder="${t('search.hero.placeholder')}" value="${state.heroQuery}"></label><div class="mod-grid">${heroMods.length ? heroMods.map(card).join('') : `<div class="empty"><strong>${t('catalog.noMods')}</strong>${t('catalog.emptySlotHint', 'Try another slot or search.')}</div>`}</div></section>`; $('#hero-back').onclick = () => { state.hero = ''; state.heroSlot = 'all'; loadCatalog(); }; $('#hero-search').oninput = (event) => { state.heroQuery = event.target.value; clearTimeout(window.heroSearchTimer); window.heroSearchTimer = setTimeout(loadCatalog, 220); }; document.querySelectorAll('[data-slot]').forEach((node) => node.onclick = () => { state.heroSlot = node.dataset.slot; renderHeroDetail(); }); document.querySelectorAll('[data-action]').forEach((node) => node.onclick = () => action(node.dataset.action, node.dataset.id)); }
function renderFeatured(mods) { const featured = [...mods].sort((left, right) => right.downloads - left.downloads).slice(0, 5); if (!featured.length) return ''; return `<section class="featured" data-featured-index="0"><div class="featured-track">${featured.map((mod, index) => `<article class="featured-slide ${index === 0 ? 'active' : ''}" data-slide="${index}" style="--featured-image:url('${mod.previewUrl || ''}')"><div class="featured-shade"></div><div class="featured-copy"><span class="featured-kicker">${index === 0 ? t('catalog.featuredMostDownloaded', 'MOST DOWNLOADED') : t('catalog.featuredFeatured', 'FEATURED MOD')}</span><h2>${mod.name}</h2><p>${mod.description}</p><div class="featured-meta"><span class="download-stat" title="${downloadsLabel(mod.downloads, true)}">${downloadsIcon()} ${mod.downloads.toLocaleString()}</span><span>${CATEGORY_LABELS[mod.categoryId] || mod.categoryId}</span></div><div class="featured-actions"><button class="action" data-action="${state.data.installed?.[mod.id] ? 'uninstall' : 'install'}" data-id="${mod.id}">${state.data.installed?.[mod.id] ? t('catalog.installed', 'Installed') : t('catalog.installMod', 'Install mod')}</button><button class="featured-author" data-featured-author="${mod.author}">${mod.author}</button></div></div></article>`).join('')}</div><button class="featured-arrow previous" data-featured-move="-1" aria-label="${t('catalog.featuredPrevious', 'Previous featured mod')}">‹</button><button class="featured-arrow next" data-featured-move="1" aria-label="${t('catalog.featuredNext', 'Next featured mod')}">›</button><div class="featured-dots">${featured.map((_, index) => `<button class="featured-dot ${index === 0 ? 'active' : ''}" data-featured-dot="${index}" aria-label="${t('catalog.featuredShow', 'Show featured mod')} ${index + 1}"></button>`).join('')}</div></section>`; }
function bindFeatured() { const root = $('.featured'); if (!root) return; const slides = [...root.querySelectorAll('.featured-slide')]; let index = 0; const show = (next) => { index = (next + slides.length) % slides.length; slides.forEach((slide, position) => slide.classList.toggle('active', position === index)); root.querySelectorAll('.featured-dot').forEach((dot, position) => dot.classList.toggle('active', position === index)); }; root.querySelectorAll('[data-featured-move]').forEach((button) => button.onclick = () => show(index + Number(button.dataset.featuredMove))); root.querySelectorAll('[data-featured-dot]').forEach((button) => button.onclick = () => show(Number(button.dataset.featuredDot))); root.querySelectorAll('[data-featured-author]').forEach((button) => button.onclick = () => { state.view = 'authors'; state.author = button.dataset.featuredAuthor; state.authorQuery = ''; state.authorSort = 'default'; document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'authors')); loadCatalog(); }); root.querySelectorAll('[data-action]').forEach((button) => button.onclick = () => action(button.dataset.action, button.dataset.id)); }
function bindCardLinks() { document.querySelectorAll('[data-card-author]').forEach((button) => button.onclick = () => { state.view = 'authors'; state.author = button.dataset.cardAuthor; state.authorQuery = ''; state.authorSort = 'default'; document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'authors')); loadCatalog(); }); document.querySelectorAll('[data-card-hero]').forEach((button) => button.onclick = () => { state.view = 'mods'; state.section = 'heroes'; state.hero = button.dataset.cardHero; state.heroSlot = button.dataset.cardSlot || 'all'; document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'mods')); loadCatalog(); }); document.querySelectorAll('[data-card-category]').forEach((button) => button.onclick = () => { state.view = 'mods'; state.section = 'all'; state.category = button.dataset.cardCategory; document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === 'mods')); loadCatalog(); }); }
function renderAuthors() { const authors = state.data.authors || []; if (state.author) return renderAuthorProfile(authors.find((author) => author.name.toLowerCase() === state.author.toLowerCase()) || { name: state.author, count: state.data.mods.length }); $('#content').innerHTML = `<div class="authors-intro"><p class="eyebrow">${t('catalog.authorIntro')}</p><h2>${t('catalog.authorTitle')}</h2><p>${t('catalog.discover_creators')}</p></div><div class="author-grid">${authors.map((author) => `<button class="author-card" data-author="${author.name.replace(/"/g, '&quot;')}">${author.avatarUrl ? `<img class="author-avatar" src="${author.avatarUrl}" alt="">` : `<span class="author-avatar">${author.name.slice(0, 1).toUpperCase()}</span>`}<span><strong>${author.name}</strong><small>${formatTranslation(t('catalog.authorMods', '{count} mods'), { count: author.count })}</small></span><span class="author-arrow">→</span></button>`).join('')}</div>`; document.querySelectorAll('[data-author]').forEach((node) => node.onclick = () => { state.view = 'authors'; state.author = node.dataset.author; state.authorQuery = ''; state.authorSort = 'default'; loadCatalog(); }); }
function renderAuthorProfile(author) { let mods = [...(state.data.mods || [])]; if (state.authorQuery) mods = mods.filter((mod) => mod.name.toLowerCase().includes(state.authorQuery.toLowerCase())); if (state.authorSort === 'name') mods.sort((a, b) => a.name.localeCompare(b.name)); if (state.authorSort === 'date') mods.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))); const isDota2Pornfx = /^dota2pornfx$/i.test(author.name); const links = Object.entries(author.links || {}).filter(([type, url]) => url && !(isDota2Pornfx && /^website$/i.test(type))); const socialLinks = isDota2Pornfx && author.authorLink ? [...links, ['Website', author.authorLink]] : links; $('#content').innerHTML = `<button class="back-link" id="author-back">← ${t('catalog.backToAuthors', 'Back to authors')}</button><section class="author-profile"><div class="author-profile-head">${author.avatarUrl ? `<img class="author-profile-avatar" src="${author.avatarUrl}" alt="">` : `<span class="author-profile-avatar">${author.name.slice(0, 1).toUpperCase()}</span>`}<div class="author-profile-copy"><p class="eyebrow">${t('catalog.authorProfile', 'AUTHOR PROFILE')}</p><h2>${author.name}</h2>${socialLinks.length ? `<div class="author-links">${socialLinks.map(([type, url]) => `<a href="${url}" target="_blank" rel="noreferrer">${type}</a>`).join('')}</div>` : ''}<p>${author.bio || t('catalog.authorBio', 'Creator of Dota 2 cosmetic modifications.')}</p></div></div><div class="author-tools"><input id="author-mod-search" type="search" placeholder="${t('catalog.searchAuthorMods', 'Search this author’s mods')}" value="${state.authorQuery}"><select id="author-mod-sort"><option value="default">${t('catalog.defaultSort', 'Default')}</option><option value="date" ${state.authorSort === 'date' ? 'selected' : ''}>${t('catalog.newestFirst', 'Newest first')}</option><option value="name" ${state.authorSort === 'name' ? 'selected' : ''}>${t('catalog.nameAZ', 'Name A-Z')}</option></select></div><div class="author-mods-heading"><span>${formatTranslation(t('catalog.authorMods', '{count} mods'), { count: mods.length })}</span></div><div class="mod-grid">${mods.length ? mods.map(card).join('') : `<div class="empty"><strong>${t('catalog.noMods', 'No mods found')}</strong>${t('catalog.authorEmpty', 'This author has no matching mods.')}</div>`}</div></section>`; $('#author-back').onclick = () => { state.author = ''; state.authorQuery = ''; loadCatalog(); }; $('#author-mod-search').oninput = (event) => { state.authorQuery = event.target.value; clearTimeout(window.authorSearchTimer); window.authorSearchTimer = setTimeout(loadCatalog, 220); }; $('#author-mod-sort').onchange = (event) => { state.authorSort = event.target.value; renderAuthorProfile(author); }; document.querySelectorAll('[data-action]').forEach((node) => node.onclick = () => action(node.dataset.action, node.dataset.id)); }
function formatModDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) return t('catalog.dateUnknown', 'Date unavailable'); const locale = state.data?.settings?.appLanguage === 'ru' ? 'ru-RU' : 'en-US'; return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }); }
function releasedLabel() { return t('catalog.released', 'Released'); }
function downloadsLabel(value, includeCount = false) { const count = Number(value || 0).toLocaleString(); const label = t('catalog.downloads', 'Downloads'); return includeCount ? `${label}: ${count}` : `${downloadsIcon()} ${count}`; }
function downloadsIcon() { return '<span class="download-icon" aria-hidden="true">&#8595;</span>'; }
function isHiddenAuthor(name) { return /^unknown(?: author)?$/i.test(String(name || '').trim()); }
function getAuthorCardProfile(name) { return state.data.authors?.find((author) => author.name.toLowerCase() === name.toLowerCase()) || null; }
function card(mod) { const installed = state.data.installed?.[mod.id]; const hasUpdate = installed && installed.version !== mod.version; const authorName = String(mod.author || '').trim(); const hasAuthor = authorName && !/^anonymous$/i.test(authorName); const author = hasAuthor ? getAuthorCardProfile(authorName) : null; const preview = mod.previewUrl ? `<img class="preview" loading="lazy" src="${mod.previewUrl}" alt="">` : '<div class="preview preview-empty">◈</div>'; const chips = [`<button class="card-chip" data-card-category="${mod.categoryId}">${CATEGORY_LABELS[mod.categoryId] || mod.categoryId}</button>`, mod.hero ? `<button class="card-chip" data-card-hero="${mod.hero}">${mod.heroLabel || mod.hero}</button>` : '', mod.slot ? `<button class="card-chip" data-card-slot="${mod.slot}" data-card-hero="${mod.hero || ''}">${slotLabel(mod.slot)}</button>` : ''].join(''); const authorHtml = hasAuthor ? `<button class="author-link" data-card-author="${authorName}">${author?.avatarUrl ? `<img src="${author.avatarUrl}" alt="">` : '<span class="author-fallback">' + authorName.slice(0, 1).toUpperCase() + '</span>'}<span>${authorName}</span></button>` : `<span class="no-author">${t('catalog.noAuthor', 'Community mod')}</span>`; return `<article class="mod-card"><button class="open-card" data-action="details" data-id="${mod.id}" style="display:block;width:100%;padding:0;border:0;background:none;color:inherit;text-align:left">${preview}</button><div class="card-body"><div class="card-top"><div class="mod-name" title="${mod.name}">${mod.name}</div></div><div class="card-author">${authorHtml}</div><div class="card-chips">${chips}</div><div class="card-date">${releasedLabel()} ${formatModDate(mod.createdAt)}</div><div class="card-footer"><span class="badge">${hasUpdate ? t('catalog.updateAvailable', 'Update available') : installed ? t('catalog.installed', 'Installed') : mod.slot || t('catalog.cosmetic', 'Cosmetic')}</span><button class="action ${installed && !hasUpdate ? 'secondary' : ''}" data-action="${hasUpdate ? 'update' : installed ? 'uninstall' : 'install'}" data-id="${mod.id}">${hasUpdate ? t('catalog.update', 'Update') : installed ? t('catalog.uninstall', 'Uninstall') : t('catalog.installMod', 'Install mod')}</button><span class="download-count">${downloadsLabel(mod.downloads)}</span></div></div></article>`; }
function renderSettings() { const path = state.data.gamePath || t('settings.notConfigured', 'Not configured'); const settings = state.data.settings || {}; const language = settings.appLanguage || 'en'; const enabled = (value) => value ? t('settings.toggleEnabled', 'Enabled') : t('settings.toggleDisabled', 'Disabled'); $('#content').innerHTML = `<div class="settings-panel"><h2>${t('settings.title', 'Settings')}</h2><p>${t('catalog.settingsDescription', 'Control the game connection, interface behavior and update preferences.')}</p><div class="setting-row"><div><strong>${t('settings.pathLabel', 'Dota 2 installation')}</strong><div class="setting-value" title="${path}">${path}</div></div><div><button id="detect-game" class="action secondary">${t('settings.autoDetect', 'Auto detect')}</button><button id="browse-game" class="action">${t('settings.browse', 'Browse')}</button></div></div><div class="setting-row"><div><strong>${t('settings.languageFolder', 'Language folder')}</strong><div class="setting-value">${settings.langSuffix || 'russian'}</div></div><select id="language-folder"><option value="russian">${t('settings.languages.ru', 'Russian')}</option><option value="english">${t('settings.languages.en', 'English')}</option><option value="schinese">${t('settings.languages.zh', 'Simplified Chinese')}</option></select></div><div class="setting-row"><div><strong>${t('settings.appLanguage', 'Application language')}</strong><div class="setting-value">${t('settings.languageHint', 'VANTA interface language')}</div></div><select id="app-language"><option value="en">${t('settings.languages.en', 'English')}</option><option value="ru">${t('settings.languages.ru', 'Russian')}</option></select></div><div class="setting-row"><div><strong>${t('settings.autoUpdate', 'Auto update')}</strong><div class="setting-value">${t('settings.autoUpdateHint', 'Check for VANTA updates')}</div></div><button id="auto-update" class="toggle-button ${settings.autoUpdateEnabled !== false ? 'on' : ''}">${enabled(settings.autoUpdateEnabled !== false)}</button></div><div class="setting-row"><div><strong>${t('settings.scale', 'Interface scale')}</strong><div class="setting-value">${t('settings.scaleHint', 'Adjust interface density')}</div></div><div class="scale-control"><input id="interface-scale" type="range" min="0.8" max="1.4" step="0.05" value="${settings.interfaceScale || 1}"><output id="interface-scale-value">${Number(settings.interfaceScale || 1).toFixed(2)}×</output><button id="reset-interface-scale" class="action secondary">${t('settings.reset', 'Reset')}</button></div></div><div class="setting-row"><div><strong>${t('settings.discordActivity', 'Discord activity')}</strong><div class="setting-value">${t('settings.discordActivityHint', 'Show VANTA activity in Discord')}</div></div><button id="discord-activity" class="toggle-button ${settings.discordActivityEnabled ? 'on' : ''}">${enabled(settings.discordActivityEnabled)}</button></div><div class="setting-row"><div><strong>${t('settings.catalogSource', 'Catalog source')}</strong><div class="setting-value">GitHub · artem-prime42/dota2-mod-manager-catalog</div></div><span class="badge">${t('settings.catalogExternal', 'External')}</span></div></div>`; const set = async (key, value) => { state.data = await call('settings:set', { key, value }); renderSettings(); }; $('#detect-game').onclick = async () => { try { state.data = await call('game:detect'); updateGameStatus(state.data.gamePath); renderSettings(); toast(state.data.gamePath ? formatTranslation(t('settings.gameReadyStatus', 'Dota 2 ready · {path}'), { path: state.data.gamePath }) : t('settings.gameMissingStatus', 'Dota 2 not found — set the path in settings')); } catch (error) { toast(error.message); } }; $('#browse-game').onclick = async () => { try { state.data = await call('game:set-path'); updateGameStatus(state.data.gamePath); renderSettings(); } catch (error) { toast(error.message); } }; $('#language-folder').value = settings.langSuffix || 'russian'; $('#app-language').value = language; $('#language-folder').onchange = (event) => set('langSuffix', event.target.value); $('#app-language').onchange = (event) => set('appLanguage', event.target.value); $('#auto-update').onclick = () => set('autoUpdateEnabled', settings.autoUpdateEnabled === false); $('#discord-activity').onclick = () => set('discordActivityEnabled', !settings.discordActivityEnabled); $('#interface-scale').oninput = (event) => { document.documentElement.style.setProperty('--app-ui-scale', event.target.value); $('#interface-scale-value').value = `${Number(event.target.value).toFixed(2)}×`; }; $('#interface-scale').onchange = (event) => set('interfaceScale', Number(event.target.value)); $('#reset-interface-scale').onclick = () => { document.documentElement.style.setProperty('--app-ui-scale', '1'); set('interfaceScale', 1); }; }
async function action(type, id) { try { if (type === 'details') return showDetails(id); if (type === 'favorite') state.data = await call('favorite:toggle', { id }); const currentCatalog = { mods: state.data.mods, categories: state.data.categories }; if (type === 'install' || type === 'update') { toast(type === 'update' ? t('catalog.downloadingUpdate', 'Downloading update...') : t('catalog.downloadingInstall', 'Downloading and installing...')); state.data = { ...await call(type === 'update' ? 'mod:update' : 'mod:install', { id }), ...currentCatalog }; toast(type === 'update' ? t('catalog.modUpdated', 'Mod updated.') : t('catalog.modInstalled', 'Mod installed.')); } if (type === 'uninstall') { const modName = state.data.mods.find((mod) => mod.id === id)?.name || id; const confirmation = await showAppConfirmDialog({ title: t('catalog.removeInstalledModTitle', 'Remove mod'), message: formatTranslation(t('catalog.removeInstalledModMessage', 'Remove "{name}" from the library?'), { name: modName }), confirmLabel: t('catalog.uninstall', 'Uninstall'), destructive: true }); if (!confirmation.confirmed) return; state.data = { ...await call('mod:uninstall', { id }), ...currentCatalog }; toast(t('catalog.modRemoved', 'Mod removed.')); } render(); } catch (error) { toast(error.message); } }
function showDetails(id) { const mod = state.data.mods.find((item) => item.id === id); if (!mod) return; const installed = state.data.installed?.[id]; const authorName = String(mod.author || '').trim(); const hasAuthor = authorName && !/^anonymous$/i.test(authorName); const author = hasAuthor ? getAuthorCardProfile(authorName) : null; const videoButton = isVideoPreview(mod.videoUrl) ? `<button class="action secondary preview-action details-preview-button" data-preview-url="${mod.videoUrl}" data-preview-title="${mod.name}">${t('catalog.preview', 'Preview')}</button>` : ''; $('#details-content').innerHTML = `${mod.previewUrl ? `<img class="details-hero" src="${mod.previewUrl}" alt="">` : ''}<div class="details-body"><div class="eyebrow">${CATEGORY_LABELS[mod.categoryId] || mod.categoryId} ${mod.heroLabel ? `· ${mod.heroLabel}` : ''}</div><h2>${mod.name}</h2>${hasAuthor ? `<button class="author-link" data-card-author="${authorName}">${author?.avatarUrl ? `<img src="${author.avatarUrl}" alt="">` : `<span class="author-fallback">${authorName.slice(0, 1).toUpperCase()}</span>`}<span>${authorName}</span></button>` : ''}<div class="meta">${releasedLabel()} ${formatModDate(mod.createdAt)}</div><p>${mod.description}</p><div class="card-chips"><button class="card-chip" data-card-category="${mod.categoryId}">${CATEGORY_LABELS[mod.categoryId] || mod.categoryId}</button>${mod.hero ? `<button class="card-chip" data-card-hero="${mod.hero}">${mod.heroLabel || mod.hero}</button>` : ''}${mod.slot ? `<button class="card-chip" data-card-slot="${mod.slot}" data-card-hero="${mod.hero || ''}">${slotLabel(mod.slot)}</button>` : ''}</div><div class="details-actions">${videoButton}<button class="action ${installed ? 'secondary' : ''}" data-action="${installed ? 'uninstall' : 'install'}" data-id="${id}">${installed ? t('catalog.uninstall', 'Uninstall') : t('catalog.installMod', 'Install mod')}</button></div></div>`; $('#details').showModal(); bindPreviewButtons(); document.querySelectorAll('#details [data-action]').forEach((node) => node.onclick = async () => { $('#details').close(); await action(node.dataset.action, node.dataset.id); }); }
document.querySelectorAll('.nav-item').forEach((node) => node.onclick = () => { state.view = node.dataset.view; state.category = 'all'; state.hero = ''; if (state.view !== 'authors') state.author = ''; document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === node)); state.view === 'settings' ? render() : loadCatalog(); }); document.querySelectorAll('.top-tab').forEach((node) => node.onclick = () => { state.section = node.dataset.top; state.category = 'all'; state.hero = ''; state.view = node.dataset.top === 'all' ? 'discover' : 'mods'; document.querySelectorAll('.top-tab').forEach((item) => item.classList.toggle('active', item === node)); document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === state.view)); loadCatalog(); }); $('#search').oninput = (event) => { state.query = event.target.value; clearTimeout(window.searchTimer); window.searchTimer = setTimeout(loadCatalog, 220); }; $('#refresh').onclick = async () => { $('#refresh').classList.add('loading'); try { state.data = await call('catalog:refresh'); toast(t('catalog.updated', 'Catalog updated.')); loadCatalog(); } catch (error) { toast(error.message); } finally { $('#refresh').classList.remove('loading'); } }; $('#close-details').onclick = () => $('#details').close(); window.vanta.onDownloadProgress((event) => { if (event.state === 'failed') toast(`${t('catalog.downloadFailed', 'Download failed')}: ${event.error}`); }); setInterval(refreshCatalogAutomatically, 10 * 60 * 1000); call('app:init').then((data) => { if (data.ok) { state.data = data.data; updateGameStatus(state.data.gamePath); } return loadCatalog(); }).catch(() => loadCatalog());