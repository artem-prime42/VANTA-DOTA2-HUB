const fs = require('fs/promises');
const path = require('path');

const HEROES = ['antimage', 'axe', 'bane', 'broodmother', 'chaos_knight', 'crystal_maiden', 'dark_seer', 'dazzle', 'drow_ranger', 'earthshaker', 'ember_spirit', 'faceless_void', 'juggernaut', 'invoker', 'jungle', 'kunkka', 'lina', 'lion', 'luna', 'mirana', 'monkey_king', 'morphling', 'necrophos', 'nevermore', 'night_stalker', 'omniknight', 'phantom_assassin', 'pudge', 'queen_of_pain', 'razor', 'riki', 'rubick', 'shadow_fiend', 'slark', 'sniper', 'spectre', 'storm_spirit', 'sven', 'templar_assassin', 'tidehunter', 'tiny', 'tusk', 'ursa', 'vengefulspirit', 'vengeful_spirit', 'windrunner', 'windranger', 'witch_doctor', 'wraith_king', 'zeus'];
const MEDIA_HERO_BASE = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/';

async function entries(directory) { try { return await fs.readdir(directory, { withFileTypes: true }); } catch { return []; } }
async function findVpkFiles(directory) { return (await entries(directory)).filter((entry) => entry.isFile() && /\.vpk(?:\.vanta-disabled|\.off|\.moff)?$/i.test(entry.name) && !/pak01_dir\.vpk/i.test(entry.name)).map((entry) => path.join(directory, entry.name)); }
function inferHero(value) { const normalized = String(value).toLowerCase().replace(/[^a-z0-9_]/g, '_'); const hero = HEROES.find((candidate) => normalized.includes(candidate)); return hero || null; }
function inferCategory(value) { const text = String(value).toLowerCase(); if (text.includes('hero')) return 'Heroes'; if (text.includes('terrain') || text.includes('river')) return 'World'; if (text.includes('shader') || text.includes('effect')) return 'Effects'; if (text.includes('hud') || text.includes('interface')) return 'Interface'; return 'Other'; }
function catalogArchiveNames(catalogMods) {
  return new Set(catalogMods.flatMap((mod) => {
    try { return [path.basename(new URL(mod.downloadUrl).pathname, '.zip').toLowerCase()]; } catch { return []; }
  }));
}
async function detectExternalFiles(gamePath, catalogMods = [], languageFolder = '', ownedFiles = [], legacyFiles = []) {
  if (!gamePath || !languageFolder) return [];
  const configuredFolder = /^dota_/i.test(languageFolder) ? languageFolder : `dota_${languageFolder}`;
  const candidates = [path.join(gamePath, configuredFolder)];
  if (languageFolder.toLowerCase() === 'dota') candidates[0] = path.join(gamePath, 'dota');
  const owned = new Set([...ownedFiles, ...legacyFiles].map((file) => path.normalize(file).toLowerCase()));
  const legacyNames = catalogArchiveNames(catalogMods);
  const files = (await Promise.all(candidates.map((directory) => findVpkFiles(directory)))).flat().filter((file) => {
    if (owned.has(path.normalize(file).toLowerCase())) return false;
    const baseName = path.basename(file).replace(/\.(?:vanta-disabled|off|moff)$/i, '').replace(/\.vpk$/i, '').toLowerCase();
    return !legacyNames.has(baseName);
  });
  return Promise.all(files.map(async (file) => {
    const relative = path.relative(gamePath, file).replace(/\\/g, '/');
    const enabled = !/\.(?:vanta-disabled|off|moff)$/i.test(file);
    const displayRelative = relative.replace(/\.(?:vanta-disabled|off|moff)$/i, '');
    const hero = inferHero(relative);
    const catalogMatch = hero && catalogMods.find((mod) => mod.hero === hero);
    return { id: `external:${displayRelative}`, fileName: path.basename(displayRelative), relativePath: displayRelative, actualPath: file, enabled, category: inferCategory(relative), hero, heroLabel: catalogMatch?.heroLabel || (hero ? hero.replace(/_/g, ' ') : null), previewUrl: catalogMatch?.previewUrl || (hero ? `${MEDIA_HERO_BASE}${hero}.png` : null), size: (await fs.stat(file)).size };
  }));
}
module.exports = { detectExternalFiles };
