function stableModId(raw) {
  const value = raw?.id || raw?.slug || raw?.name || raw?.title;
  return String(value || 'mod').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'mod';
}

const CANONICAL_HERO_IDS = new Set(['abaddon','alchemist','ancient_apparition','anti_mage','arc_warden','axe','bane','batrider','beastmaster','bloodseeker','bounty_hunter','brewmaster','bristleback','broodmother','centaur','chaos_knight','chen','clinkz','clockwerk','crystal_maiden','dark_seer','dark_willow','dawnbreaker','dazzle','death_prophet','disruptor','doom','dragon_knight','drow_ranger','earth_spirit','earthshaker','elder_titan','ember_spirit','enchantress','enigma','faceless_void','grimstroke','gyrocopter','hoodwink','huskar','invoker','io','jakiro','juggernaut','keeper_of_the_light','kez','kunkka','largo','legion_commander','leshrac','lich','lifestealer','lina','lion','lone_druid','luna','lycan','magnus','marci','mars','medusa','meepo','mirana','monkey_king','morphling','muerta','naga_siren','nature_prophet','necrophos','night_stalker','nyx_assassin','ogre_magi','omniknight','oracle','outworld_devourer','pangolier','phantom_assassin','phantom_lancer','phoenix','primal_beast','puck','pudge','pugna','queen_of_pain','razor','riki','ringmaster','rubick','sand_king','shadow_demon','shadow_fiend','shadow_shaman','silencer','skywrath_mage','slardar','slark','snapfire','sniper','spectre','spirit_breaker','storm_spirit','sven','techies','templar_assassin','terrorblade','tidehunter','timbersaw','tinker','tiny','treant_protector','troll_warlord','tusk','underlord','undying','ursa','vengeful_spirit','venomancer','viper','visage','void_spirit','warlock','weaver','windranger','winter_wyvern','witch_doctor','wraith_king','zeus']);
const HERO_ID_TO_KEY = {
  1: 'anti_mage', 2: 'axe', 3: 'bane', 4: 'bloodseeker', 5: 'crystal_maiden', 6: 'drow_ranger', 7: 'earthshaker', 8: 'juggernaut', 9: 'mirana', 10: 'morphling', 11: 'shadow_fiend', 12: 'phantom_lancer', 13: 'puck', 14: 'pudge', 15: 'razor', 16: 'sand_king', 17: 'storm_spirit', 18: 'sven', 19: 'tiny', 20: 'vengeful_spirit', 21: 'windranger', 22: 'zeus', 23: 'kunkka', 25: 'lina', 26: 'lion', 27: 'shadow_shaman', 28: 'slardar', 29: 'tidehunter', 30: 'witch_doctor', 31: 'lich', 32: 'riki', 33: 'enigma', 34: 'tinker', 35: 'sniper', 36: 'necrophos', 37: 'warlock', 38: 'beastmaster', 39: 'queen_of_pain', 40: 'venomancer', 41: 'faceless_void', 42: 'wraith_king', 43: 'death_prophet', 44: 'phantom_assassin', 45: 'pugna', 46: 'templar_assassin', 47: 'viper', 48: 'luna', 49: 'dragon_knight', 50: 'dazzle', 51: 'clockwerk', 52: 'leshrac', 53: 'nature_prophet', 54: 'lifestealer', 55: 'dark_seer', 56: 'clinkz', 57: 'omniknight', 58: 'enchantress', 59: 'huskar', 60: 'night_stalker', 61: 'broodmother', 62: 'bounty_hunter', 63: 'weaver', 64: 'jakiro', 65: 'batrider', 66: 'chen', 67: 'spectre', 68: 'ancient_apparition', 69: 'doom', 70: 'ursa', 71: 'spirit_breaker', 72: 'gyrocopter', 73: 'alchemist', 74: 'invoker', 75: 'silencer', 76: 'outworld_devourer', 77: 'lycan', 78: 'brewmaster', 79: 'shadow_demon', 80: 'lone_druid', 81: 'chaos_knight', 82: 'meepo', 83: 'treant_protector', 84: 'ogre_magi', 85: 'undying', 86: 'rubick', 87: 'disruptor', 88: 'nyx_assassin', 89: 'naga_siren', 90: 'keeper_of_the_light', 91: 'io', 92: 'visage', 93: 'slark', 94: 'medusa', 95: 'troll_warlord', 96: 'centaur', 97: 'magnus', 98: 'timbersaw', 99: 'bristleback', 100: 'tusk', 101: 'skywrath_mage', 102: 'abaddon', 103: 'elder_titan', 104: 'legion_commander', 105: 'techies', 106: 'ember_spirit', 107: 'earth_spirit', 108: 'underlord', 109: 'terrorblade', 110: 'phoenix', 111: 'oracle', 112: 'winter_wyvern', 113: 'arc_warden', 114: 'monkey_king', 119: 'dark_willow', 120: 'pangolier', 121: 'grimstroke', 123: 'hoodwink', 126: 'void_spirit', 128: 'snapfire', 129: 'mars', 131: 'ringmaster', 135: 'dawnbreaker', 136: 'marci', 137: 'primal_beast', 138: 'muerta', 145: 'kez', 155: 'largo'
};

const HERO_DISPLAY_NAMES = {
  anti_mage: 'Anti Mage', axe: 'Axe', bane: 'Bane', bloodseeker: 'Bloodseeker', crystal_maiden: 'Crystal Maiden', drow_ranger: 'Drow Ranger', earthshaker: 'Earthshaker', juggernaut: 'Juggernaut', mirana: 'Mirana', morphling: 'Morphling', shadow_fiend: 'Shadow Fiend', phantom_lancer: 'Phantom Lancer', puck: 'Puck', pudge: 'Pudge', razor: 'Razor', sand_king: 'Sand King', storm_spirit: 'Storm Spirit', sven: 'Sven', tiny: 'Tiny', vengeful_spirit: 'Vengeful Spirit', windranger: 'Windranger', zeus: 'Zeus', kunkka: 'Kunkka', lina: 'Lina', lion: 'Lion', shadow_shaman: 'Shadow Shaman', slardar: 'Slardar', tidehunter: 'Tidehunter', witch_doctor: 'Witch Doctor', lich: 'Lich', riki: 'Riki', enigma: 'Enigma', tinker: 'Tinker', sniper: 'Sniper', necrophos: 'Necrophos', warlock: 'Warlock', beastmaster: 'Beastmaster', queen_of_pain: 'Queen of Pain', venomancer: 'Venomancer', faceless_void: 'Faceless Void', wraith_king: 'Wraith King', death_prophet: 'Death Prophet', phantom_assassin: 'Phantom Assassin', pugna: 'Pugna', templar_assassin: 'Templar Assassin', viper: 'Viper', luna: 'Luna', dragon_knight: 'Dragon Knight', dazzle: 'Dazzle', clockwerk: 'Clockwerk', leshrac: 'Leshrac', nature_prophet: 'Nature\'s Prophet', lifestealer: 'Lifestealer', dark_seer: 'Dark Seer', clinkz: 'Clinkz', omniknight: 'Omniknight', enchantress: 'Enchantress', huskar: 'Huskar', night_stalker: 'Night Stalker', broodmother: 'Broodmother', bounty_hunter: 'Bounty Hunter', weaver: 'Weaver', jakiro: 'Jakiro', batrider: 'Batrider', chen: 'Chen', spectre: 'Spectre', ancient_apparition: 'Ancient Apparition', doom: 'Doom', ursa: 'Ursa', spirit_breaker: 'Spirit Breaker', gyrocopter: 'Gyrocopter', alchemist: 'Alchemist', invoker: 'Invoker', silencer: 'Silencer', outworld_devourer: 'Outworld Destroyer', lycan: 'Lycan', brewmaster: 'Brewmaster', shadow_demon: 'Shadow Demon', lone_druid: 'Lone Druid', chaos_knight: 'Chaos Knight', meepo: 'Meepo', treant_protector: 'Treant Protector', ogre_magi: 'Ogre Magi', undying: 'Undying', rubick: 'Rubick', disruptor: 'Disruptor', nyx_assassin: 'Nyx Assassin', naga_siren: 'Naga Siren', keeper_of_the_light: 'Keeper of the Light', io: 'Io', visage: 'Visage', slark: 'Slark', medusa: 'Medusa', troll_warlord: 'Troll Warlord', centaur: 'Centaur', magnus: 'Magnus', timbersaw: 'Timbersaw', bristleback: 'Bristleback', tusk: 'Tusk', skywrath_mage: 'Skywrath Mage', abaddon: 'Abaddon', elder_titan: 'Elder Titan', legion_commander: 'Legion Commander', techies: 'Techies', ember_spirit: 'Ember Spirit', earth_spirit: 'Earth Spirit', underlord: 'Underlord', terrorblade: 'Terrorblade', phoenix: 'Phoenix', oracle: 'Oracle', winter_wyvern: 'Winter Wyvern', arc_warden: 'Arc Warden', monkey_king: 'Monkey King', dark_willow: 'Dark Willow', pangolier: 'Pangolier', grimstroke: 'Grimstroke', hoodwink: 'Hoodwink', void_spirit: 'Void Spirit', snapfire: 'Snapfire', mars: 'Mars', ringmaster: 'Ringmaster', dawnbreaker: 'Dawnbreaker', marci: 'Marci', primal_beast: 'Primal Beast', muerta: 'Muerta', kez: 'Kez', largo: 'Largo'
};

function heroKeyFromId(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return HERO_ID_TO_KEY[Number(raw)] || null;
  return normalizeHeroKey(raw);
}

function heroDisplayName(value) {
  const key = heroKeyFromId(value);
  if (!key) return 'Unknown Hero';
  return HERO_DISPLAY_NAMES[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeHeroKey(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return heroKeyFromId(raw) || null;
  const aliasMap = {
    'anti mage': 'anti_mage', 'anti-mage': 'anti_mage', antimage: 'anti_mage',
    'nature prophet': 'nature_prophet', "nature's prophet": 'nature_prophet', 'natures prophet': 'nature_prophet', furion: 'nature_prophet',
    'outworld devourer': 'outworld_devourer', 'outworld-devourer': 'outworld_devourer', 'outworld destroyer': 'outworld_devourer', 'outworld-destroyer': 'outworld_devourer', outworld_destroyer: 'outworld_devourer', 'obsidian destroyer': 'outworld_devourer', 'obsidian-destroyer': 'outworld_devourer', obsidian_destroyer: 'outworld_devourer',
    'queen of pain': 'queen_of_pain', 'queen-of-pain': 'queen_of_pain', queenofpain: 'queen_of_pain',
    'shadow fiend': 'shadow_fiend', 'shadow-fiend': 'shadow_fiend', nevermore: 'shadow_fiend',
    'treant protector': 'treant_protector', 'treant-protector': 'treant_protector',
    'vengeful spirit': 'vengeful_spirit', 'vengeful-spirit': 'vengeful_spirit', vengefulspirit: 'vengeful_spirit',
    'windranger': 'windranger', windrunner: 'windranger',
    'rattletrap': 'clockwerk', wisp: 'io', 'life stealer': 'lifestealer', 'life-stealer': 'lifestealer', life_stealer: 'lifestealer', magnataur: 'magnus', 'abyssal underlord': 'underlord', 'abyssal-underlord': 'underlord', shredder: 'timbersaw', 'obsidian destroyer': 'outworld_devourer',
  };
  const direct = aliasMap[raw];
  if (direct) return direct;
  if (CANONICAL_HERO_IDS.has(raw)) return raw;
  const normal = raw.replace(/['’.-]+/g, ' ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return CANONICAL_HERO_IDS.has(normal) ? normal : (normal || null);
}

function normalizeMod(raw, index = 0) {
  const name = String(raw?.name || raw?.title || `Mod ${index + 1}`).trim();
  const hero = normalizeHeroKey(raw?.hero || raw?.heroId || raw?.heroName || raw?.heroLabel);
  return {
    id: stableModId(raw),
    name,
    author: String(raw?.author || 'Unknown author').trim(),
    previewUrl: raw?.preview || raw?.image || null,
    videoUrl: raw?.video || null,
    downloadUrl: raw?.file || raw?.download_url || raw?.downloadUrl || raw?.url || null,
    categoryId: String(raw?.categoryId || raw?.category || 'other'),
    hero,
    heroLabel: raw?.heroLabel || (hero ? hero.replace(/_/g, ' ') : null),
    slot: raw?.slot || null,
    tags: Array.isArray(raw?.tags) ? raw.tags.map(String) : raw?.tags && typeof raw.tags === 'object' ? Object.entries(raw.tags).filter(([, value]) => value).map(([key]) => key) : [],
    description: String(raw?.description || raw?.desc || ''),
    version: String(raw?.version || raw?.updatedAt || raw?.createdAt || 'catalog'),
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || raw?.updated_at || null,
    downloads: Number(raw?.downloads || 0),
  };
}

function normalizeAuthor(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const links = raw.links && typeof raw.links === 'object' ? raw.links : {};
  return { ...raw, nick: String(raw.nick || raw.displayName || raw.name || '').trim(), photo: raw.photo || raw.avatarUrl || raw.avatar || null, avatarUrl: raw.avatarUrl || raw.photo || raw.avatar || null, links: Object.fromEntries(Object.entries(links).filter(([, value]) => value)) };
}

function flattenCatalog(payload) {
  const data = payload?.mods?.modsData || payload?.modsData || payload;
  const result = [];
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object' && (item.name || item.title || item.file || item.download_url)) {
          result.push(item);
        } else visit(item);
      });
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(data);
  const seen = new Set();
  return result.map(normalizeMod).filter((mod) => {
    if (seen.has(mod.id)) return false;
    seen.add(mod.id);
    return true;
  });
}

function searchMods(mods, query, filters = {}) {
  const needle = String(query || '').trim().toLowerCase();
  const heroFilter = normalizeHeroKey(filters.hero);
  return mods.filter((mod) => {
    const haystack = [mod.name, mod.author, mod.categoryId, mod.heroLabel, ...mod.tags].join(' ').toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
    if (filters.category && filters.category !== 'all' && mod.categoryId !== filters.category) return false;
    if (heroFilter && mod.hero !== heroFilter) return false;
    return true;
  });
}

module.exports = { CANONICAL_HERO_IDS, HERO_ID_TO_KEY, heroKeyFromId, heroDisplayName, flattenCatalog, normalizeAuthor, normalizeMod, searchMods, stableModId };