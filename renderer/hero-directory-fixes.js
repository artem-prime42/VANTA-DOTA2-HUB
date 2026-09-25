const CANONICAL_HEROES = 'abaddon alchemist ancient_apparition anti_mage arc_warden axe bane batrider beastmaster bloodseeker bounty_hunter brewmaster bristleback centaur chaos_knight chen clinkz clockwerk crystal_maiden dark_seer dark_willow dawnbreaker dazzle death_prophet disruptor doom dragon_knight drow_ranger earth_spirit earthshaker elder_titan ember_spirit enchantress enigma faceless_void grimstroke gyrocopter hoodwink huskar invoker io jakiro juggernaut keeper_of_the_light kez kunkka largo legion_commander leshrac lich lifestealer lina lion lone_druid luna lycan magnus marci mars medusa meepo mirana monkey_king morphling muerta naga_siren nature_prophet necrophos night_stalker nyx_assassin ogre_magi omniknight oracle outworld_devourer pangolier phantom_assassin phantom_lancer phoenix primal_beast puck pudge pugna queen_of_pain razor riki ringmaster rubick sand_king shadow_demon shadow_fiend shadow_shaman silencer skywrath_mage slardar slark snapfire sniper spectre spirit_breaker storm_spirit sven techies templar_assassin terrorblade tidehunter timbersaw tinker tiny treant_protector troll_warlord tusk underlord undying ursa vengeful_spirit venomancer viper visage void_spirit warlock weaver windranger winter_wyvern witch_doctor wraith_king zeus'.split(' ');
const HERO_PORTRAITS = { anti_mage: 'antimage', clockwerk: 'rattletrap', doom: 'doom_bringer', io: 'wisp', lifestealer: 'life_stealer', magnus: 'magnataur', nature_prophet: 'furion', necrophos: 'necrolyte', outworld_devourer: 'obsidian_destroyer', queen_of_pain: 'queenofpain', shadow_fiend: 'nevermore', timbersaw: 'shredder', treant_protector: 'treant', underlord: 'abyssal_underlord', vengeful_spirit: 'vengefulspirit', wraith_king: 'skeleton_king', windranger: 'windrunner', zeus: 'zuus' };
const HERO_ATTRIBUTE_MAP = {
  strength: new Set('alchemist axe bristleback centaur chaos_knight clockwerk dawnbreaker doom dragon_knight earth_spirit earthshaker elder_titan huskar kunkka largo legion_commander lifestealer lycan mars night_stalker ogre_magi omniknight phoenix primal_beast pudge slardar spirit_breaker sven tidehunter timbersaw tiny treant_protector tusk underlord undying wraith_king'.split(' ')),
  agility: new Set('anti_mage bloodseeker bounty_hunter broodmother clinkz drow_ranger ember_spirit faceless_void gyrocopter hoodwink juggernaut kez lone_druid luna medusa meepo mirana monkey_king morphling naga_siren phantom_assassin phantom_lancer razor riki shadow_fiend slark sniper spectre templar_assassin terrorblade troll_warlord ursa vengeful_spirit viper weaver'.split(' ')),
  intelligence: new Set('ancient_apparition chen crystal_maiden dark_seer dark_willow disruptor enchantress grimstroke invoker jakiro keeper_of_the_light leshrac lich lina lion muerta necrophos oracle outworld_devourer puck pugna queen_of_pain rubick shadow_demon shadow_shaman silencer skywrath_mage storm_spirit tinker warlock witch_doctor zeus'.split(' ')),
  universal: new Set('abaddon arc_warden bane beastmaster batrider brewmaster dazzle death_prophet enigma io magnus marci nature_prophet nyx_assassin pangolier sand_king snapfire techies venomancer visage void_spirit windranger'.split(' ')),
};

function heroDirectoryLabel(id) { return id.split('_').map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(' '); }
function normalizeHeroId(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return '';
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
function heroDirectoryId(mod) { return normalizeHeroId(mod.hero || mod.heroId || mod.heroName || mod.heroLabel || ''); }
function heroDirectoryPortrait(id) { return HERO_PORTRAITS[id] || id; }
function heroDirectoryEscape(value) { return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function heroDirectoryAttribute(id) { return Object.entries(HERO_ATTRIBUTE_MAP).find(([, heroes]) => heroes.has(id))?.[0] || 'universal'; }
function heroTags(mod) { if (Array.isArray(mod.tags)) return mod.tags.map((tag) => String(tag).trim().toLowerCase()); if (mod.tags && typeof mod.tags === 'object') return Object.entries(mod.tags).filter(([, value]) => value).map(([tag]) => tag.toLowerCase()); return []; }
function heroHasTag(hero, tag) { return hero.mods.some((mod) => { const name = String(mod.name || '').toLowerCase(); return heroTags(mod).some((value) => value === tag || value.includes(tag)) || (tag === 'arcana' && name.includes('arcana')) || (tag === 'immortal' && name.includes('immortal')); }); }
function heroCategoryButton(label, type, value, active = false) { return `<button class="hero-category-button${active ? ' active' : ''}" data-hero-category-type="${type}" data-hero-category-value="${value}">${label}</button>`; }
function showHeroDirectoryStats(hero, allHeroes) { const dialog = document.createElement('dialog'); const rank = [...allHeroes].sort((left, right) => right.downloads - left.downloads || left.label.localeCompare(right.label)).findIndex((item) => item.id === hero.id) + 1; dialog.className = 'hero-stats-dialog'; dialog.innerHTML = `<button class="dialog-close" aria-label="Close">×</button><div class="hero-stats-body"><p class="eyebrow">HERO POPULARITY</p><h2>${heroDirectoryEscape(hero.label)}</h2><div class="hero-stat-grid"><strong>${hero.downloads.toLocaleString()}<small>Total downloads</small></strong><strong>#${rank || '-'}<small>Popularity rank</small></strong><strong>${hero.count}<small>Catalog mods</small></strong></div></div>`; document.body.appendChild(dialog); dialog.showModal(); dialog.querySelector('.dialog-close').onclick = () => dialog.close(); dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }); dialog.addEventListener('close', () => dialog.remove()); }

function renderHeroCategoryGrid() {
  return `<div class="hero-category-grid"><section class="hero-category-column"><h3>Атрибуты</h3><div class="hero-category-options">${heroCategoryButton('Все', 'attribute', 'all', true)}${heroCategoryButton('Сила', 'attribute', 'strength')}${heroCategoryButton('Ловкость', 'attribute', 'agility')}${heroCategoryButton('Интеллект', 'attribute', 'intelligence')}${heroCategoryButton('Универсал', 'attribute', 'universal')}</div></section><section class="hero-category-column"><h3>Редкость</h3><div class="hero-category-options">${heroCategoryButton('Все', 'rarity', 'all', true)}${heroCategoryButton('Arcana', 'rarity', 'arcana')}${heroCategoryButton('Immortal', 'rarity', 'immortal')}</div></section><section class="hero-category-column"><h3>Теги</h3><div class="hero-category-options">${heroCategoryButton('Все', 'tag', 'all', true)}${heroCategoryButton('Аниме', 'tag', 'anime')}</div></section><section class="hero-category-column"><h3>Остальное</h3><div class="hero-category-options">${heroCategoryButton('Все', 'sort', 'all', true)}${heroCategoryButton('Недавно обновлённые', 'sort', 'recent')}${heroCategoryButton('С большим количеством модов', 'sort', 'mods')}${heroCategoryButton('Популярные', 'sort', 'popular')}</div></section></div>`;
}

function renderHeroDirectory() {
  const entries = new Map(CANONICAL_HEROES.map((id) => [id, { id, label: heroDirectoryLabel(id), count: 0, downloads: 0, updatedAt: 0, mods: [] }]));
  for (const mod of state.data.mods || []) {
    const id = heroDirectoryId(mod);
    if (!id) continue;
    const entry = entries.get(id) || { id, label: mod.heroLabel || heroDirectoryLabel(id), count: 0, downloads: 0, updatedAt: 0, mods: [] };
    entry.label = mod.heroLabel || entry.label;
    entry.count += 1;
    entry.downloads += Number(mod.downloads || 0);
    entry.updatedAt = Math.max(entry.updatedAt, Date.parse(mod.updatedAt || mod.createdAt || '') || 0);
    entry.mods.push(mod);
    entries.set(id, entry);
  }
  const heroes = [...entries.values()];
  const popularity = [...heroes].sort((left, right) => right.downloads - left.downloads || left.label.localeCompare(right.label));
  const rankById = new Map(popularity.map((hero, index) => [hero.id, index + 1]));
  $('#content').innerHTML = `<div class="hero-directory-head"><div class="hero-directory-tools" data-category-grid="1">${renderHeroCategoryGrid()}</div><span class="result-count" data-hero-result-count>${heroes.length} heroes</span></div><div class="hero-grid">${heroes.map((hero) => `<article class="hero-card" data-hero="${heroDirectoryEscape(hero.id)}" role="button" tabindex="0"><img src="${HERO_PORTRAIT_BASE}${heroDirectoryPortrait(hero.id)}.png" alt="${heroDirectoryEscape(hero.label)}"><span class="hero-card-shade"></span><span class="hero-card-copy"><strong>${heroDirectoryEscape(hero.label)}</strong><small>${hero.count} mods</small></span><button class="hero-downloads" data-hero-stats="${heroDirectoryEscape(hero.id)}" aria-label="Show ${heroDirectoryEscape(hero.label)} download statistics" title="Total downloads · popularity rank">?</button></article>`).join('')}</div>`;
  document.querySelector('.hero-directory-head')?.setAttribute('data-enhanced', '1');
  state.heroDirectoryFilters ||= { attribute: 'all', rarity: 'all', tag: 'all', sort: 'all' };
  const selected = state.heroDirectoryFilters;
  const filterValues = { attribute: ['strength', 'agility', 'intelligence', 'universal'], rarity: ['arcana', 'immortal'], tag: ['anime'], sort: ['recent', 'mods', 'popular'] };
  Object.keys(filterValues).forEach((type) => { if (selected[type] !== 'all') selected[type] = Array.isArray(selected[type]) ? selected[type] : selected[type] ? [selected[type]] : []; if (!selected[type].length || selected[type].length === filterValues[type].length) selected[type] = 'all'; });
  const matchesFilter = (type, hero) => selected[type] === 'all' || (type === 'attribute' ? selected[type].includes(heroDirectoryAttribute(hero.id)) : selected[type].some((tag) => heroHasTag(hero, tag)));
  const apply = () => {
    let visible = heroes.filter((hero) => matchesFilter('attribute', hero) && matchesFilter('rarity', hero) && matchesFilter('tag', hero));
    if (selected.sort !== 'all' && selected.sort.includes('recent')) visible.sort((left, right) => right.updatedAt - left.updatedAt);
    else if (selected.sort !== 'all' && selected.sort.includes('mods')) visible.sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
    else if (selected.sort !== 'all' && selected.sort.includes('popular')) visible.sort((left, right) => right.downloads - left.downloads || left.label.localeCompare(right.label));
    else visible.sort((left, right) => left.label.localeCompare(right.label));
    const visibleIds = new Set(visible.map((hero) => hero.id));
    const grid = document.querySelector('.hero-grid');
    const cards = new Map([...document.querySelectorAll('.hero-card')].map((card) => [card.dataset.hero, card]));
    if (grid) visible.forEach((hero) => { const card = cards.get(hero.id); if (card) grid.appendChild(card); });
    document.querySelectorAll('.hero-card').forEach((card) => { card.style.display = visibleIds.has(card.dataset.hero) ? '' : 'none'; });
    const result = document.querySelector('[data-hero-result-count]'); if (result) result.textContent = `${visible.length} heroes`;
    document.querySelectorAll('[data-hero-category-type]').forEach((button) => { const type = button.dataset.heroCategoryType; const value = button.dataset.heroCategoryValue; button.classList.toggle('active', value === 'all' ? selected[type] === 'all' : selected[type] !== 'all' && selected[type].includes(value)); });
  };
  document.querySelectorAll('[data-hero-category-type]').forEach((button) => button.onclick = () => { const type = button.dataset.heroCategoryType; const value = button.dataset.heroCategoryValue; if (value === 'all') selected[type] = 'all'; else if (type === 'tag') selected[type] = selected[type] !== 'all' && selected[type].includes(value) ? 'all' : [value]; else { const values = selected[type] === 'all' ? [] : [...selected[type]]; const index = values.indexOf(value); if (index >= 0) values.splice(index, 1); else values.push(value); selected[type] = !values.length || values.length === filterValues[type].length ? 'all' : values; } state.heroDirectoryFilters = { ...selected }; apply(); });
  document.querySelectorAll('[data-hero-stats]').forEach((button) => button.onclick = (event) => { event.stopPropagation(); const hero = heroes.find((item) => item.id === button.dataset.heroStats); if (hero) showHeroDirectoryStats(hero, heroes); });
  document.querySelectorAll('[data-hero]').forEach((node) => { node.onclick = (event) => { if (event.target.closest('[data-hero-stats]')) return; state.hero = node.dataset.hero; state.heroSlot = 'all'; state.heroQuery = ''; loadCatalog(); }; node.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); node.click(); } }; });
  apply();
}

window.renderHeroDirectory = renderHeroDirectory;
