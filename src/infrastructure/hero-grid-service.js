const fs = require('fs/promises');
const path = require('path');
const { CANONICAL_HERO_IDS, heroKeyFromId, heroDisplayName } = require('../core/models');
const { HeroGridInstaller, validateConfig } = require('./hero-grid-installer');

const PATCHES_ROOT = path.join(__dirname, '..', 'data', 'hero-grids');
const MODES = ['most-played', 'high-winrate'];
const ROLE_ALIASES = { 'soft-support': 'support-4', 'hard-support': 'support-5' };
const ROLES = [
  { id: 'all-roles', label: 'All Roles', configIndex: 0, sourceConfigIndex: 0, categoryNames: ['Carry', 'Mid', 'Offlane', 'Support', 'Hard Support'] },
  { id: 'carry', label: 'Carry', configIndex: 0, sourceConfigIndex: 1, categoryNames: ['Carry'] },
  { id: 'mid', label: 'Mid', configIndex: 0, sourceConfigIndex: 2, categoryNames: ['Mid'] },
  { id: 'offlane', label: 'Offlane', configIndex: 0, sourceConfigIndex: 3, categoryNames: ['Offlane'] },
  { id: 'support-4', label: 'Support 4', configIndex: 0, sourceConfigIndex: 4, categoryNames: ['Support'] },
  { id: 'support-5', label: 'Support 5', configIndex: 0, sourceConfigIndex: 5, categoryNames: ['Hard Support'] },
];

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function normalizeRoleId(role) {
  const value = String(role || 'all-roles');
  return ROLE_ALIASES[value] || value;
}

function normalizeType(mode) {
  if (mode === 'highWinrate' || mode === 'high-winrate') return 'high-winrate';
  return 'most-played';
}

function normalizeSelection(selection) {
  if (!selection || typeof selection !== 'object') return null;
  const role = normalizeRoleId(selection.role || 'all-roles');
  const type = normalizeType(selection.type || selection.mode || 'most-played');
  return {
    patch: selection.patch || '7.41f',
    role,
    type,
  };
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function validateGrid(grid) {
  if (!grid || !Array.isArray(grid.configs) || !grid.configs.length) throw new Error('Hero grid configuration is invalid');
  const overview = grid.configs[0];
  if (!Array.isArray(overview.categories)) throw new Error('Hero grid categories are missing');
  const allHeroes = overview.categories.find((category) => category.category_name === 'All Heroes');
  if (!allHeroes || !Array.isArray(allHeroes.hero_ids) || !allHeroes.hero_ids.length) throw new Error('Hero grid hero list is missing');
  const knownIds = new Set(allHeroes.hero_ids.filter((id) => Number.isInteger(id)));
  if (knownIds.size !== allHeroes.hero_ids.length) throw new Error('Hero grid contains invalid hero IDs');
  for (const config of grid.configs) {
    for (const category of config.categories || []) {
      if (!Array.isArray(category.hero_ids) || category.hero_ids.some((id) => !knownIds.has(id))) throw new Error('Hero grid contains an unknown hero');
    }
  }
  return { knownIds, allHeroes: allHeroes.hero_ids };
}

function previewCategories(grid, role) {
  const config = grid.configs[role.configIndex] || grid.configs[0];
  const categories = config.categories || [];

  const mapHero = (id) => {
    const key = heroKeyFromId(id);
    return {
      id,
      key,
      displayName: heroDisplayName(key),
    };
  };

  if (role.id === 'all-roles') {
    return categories
      .filter((item) => item.category_name !== 'All Heroes')
      .map((item) => ({
        name: item.category_name,
        heroes: (item.hero_ids || []).slice(0, 7).map(mapHero),
      }));
  }

  const selected = categories.filter((item) => role.categoryNames.includes(item.category_name));
  const category = selected[0] || categories.find((item) => item.category_name === role.categoryNames[0]) || categories[0];
  return [{
    name: category.category_name,
    heroes: (category.hero_ids || []).slice(0, 7).map(mapHero),
  }];
}

class HeroGridService {
  constructor({ storage, rootDir = storage.rootDir, getGamePath, getLanguageFolder = () => 'russian' }) {
    this.storage = storage;
    this.getGamePath = getGamePath;
    this.getLanguageFolder = getLanguageFolder;
    this.installer = new HeroGridInstaller({ rootDir, getGamePath });
  }

  async list() {
    const entries = await fs.readdir(PATCHES_ROOT, { withFileTypes: true });
    const patches = [];
    for (const entry of entries.filter((item) => item.isDirectory())) {
      const patch = entry.name;
      const availableModes = [];
      for (const mode of MODES) {
        const file = path.join(PATCHES_ROOT, patch, `${mode}.json`);
        try {
          const grid = await readJson(file);
          validateGrid(grid);
          availableModes.push({ id: mode, file, grid });
        } catch {}
      }
      if (availableModes.length) patches.push({ patch, modes: availableModes });
    }
    const installation = await this.installer.detect();
    const selected = installation.installed ? normalizeSelection(installation.metadata) : null;
    return {
      patches: patches.map(({ patch, modes }) => ({
        patch,
        modes: modes.map(({ id, grid }) => ({ id, version: grid.version, roles: ROLES.map((role) => ({ ...role, preview: previewCategories(grid, role), installed: Boolean(installation.installed && installation.metadata?.patch === patch && installation.metadata?.type === id && installation.metadata?.role === role.id) })) })),
      })),
      selected,
      installation,
    };
  }

  async diagnose() { return this.installer.diagnostics(); }

  async userGrids() {
    const current = await this.installer.currentConfig();
    if (!current.config) return { target: current.target?.configPath || null, grids: [] };
    return {
      target: current.target.configPath,
      grids: current.config.configs.map((config, index) => ({
        index,
        name: config.config_name,
        isMeta: /^Dota2ProTracker\b/i.test(String(config.config_name || '')),
        categories: config.categories.length,
      })),
    };
  }

  async removeUserGrids() { return this.installer.removeUserConfigs(); }
  async removeUserGrid(index) { return this.installer.removeUserConfig(index); }

  async resolveConfig(patch, mode) {
    const normalizedMode = normalizeType(mode);
    if (!/^[0-9]+\.[0-9]+[a-z]?$/.test(String(patch || '')) || !MODES.includes(normalizedMode)) throw new Error('Hero grid selection is invalid');
    const file = path.join(PATCHES_ROOT, patch, `${normalizedMode}.json`);
    const grid = await readJson(file).catch(() => null);
    if (!grid) throw new Error('Hero grid file is unavailable');
    validateGrid(grid);
    return grid;
  }

  async apply({ patch, mode, type, role = 'all-roles' }) {
    const normalizedType = normalizeType(type || mode || 'most-played');
    const normalizedRole = normalizeRoleId(role || 'all-roles');
    const grid = await this.resolveConfig(patch, normalizedType);
    const roleData = ROLES.find((item) => item.id === normalizedRole) || ROLES[0];
    const selectedConfig = grid.configs[roleData.sourceConfigIndex] || grid.configs[0];
    const installConfig = { version: grid.version, configs: [selectedConfig] };
    validateConfig(installConfig);
    const installation = await this.installer.install({ config: installConfig, patch, role: normalizedRole, type: normalizedType });
    const selection = { patch, role: normalizedRole, type: normalizedType };
    await this.storage.patch({ settings: { ...this.storage.state.settings, heroGridSelection: selection } });
    return { selection, target: installation.metadata.targetPath, installation };
  }

  async disable() {
    const result = await this.installer.disable();
    await this.storage.patch({ settings: { ...this.storage.state.settings, heroGridSelection: null } });
    return result;
  }
}

module.exports = { HeroGridService, MODES, ROLES, validateGrid };