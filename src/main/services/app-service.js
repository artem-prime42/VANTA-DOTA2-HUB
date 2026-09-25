const fs = require('fs/promises');
const path = require('path');
const crypto = require('node:crypto');
const { VpkReader, VpkWriter } = require('vpk-tools');
const { JsonStorage } = require('../../infrastructure/storage');
const { CatalogClient } = require('../../infrastructure/catalog-client');
const { DownloadManager } = require('../../infrastructure/download-manager');
const { ModManager } = require('../../application/mod-manager');
const { SavedPackStore } = require('../../infrastructure/saved-pack-store');
const { detectDota, validateDota } = require('../../infrastructure/steam-detector');
const { searchMods } = require('../../core/models');
const { detectExternalFiles } = require('../../infrastructure/external-files');
const { HeroGridService } = require('../../infrastructure/hero-grid-service');

const DISCORD_APP_ID = '1551207182744166511';

const AUTHOR_AVATARS = {
  papapodzaborniy: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/papapodzaborniy.jpg',
  dota2pornfx: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/dota2pornfx.png',
  darkness: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/darkness.jpg',
  arthas: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/arthas.jpg',
  xiiipsiblade: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/XIIIpsiblade.jpg',
  dota2vpk: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/dota2vpk.jpg',
  mopsyara: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/mopsyara.jpg',
  tenkay: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/tenkay.jpg',
  nahuitosay: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/NahuiToSay.jpg',
  hi: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/hi.jpg',
  senop: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/senop.jpg',
  dddddddddddd: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/dddddddddddddd.jpg',
  fin: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/fin.jpg',
  ceomods: 'https://raw.githubusercontent.com/artem-prime42/dota2-media/main/images/Dikiychyvak.jpg',
};
const HIDDEN_AUTHORS = /^unknown(?: author)?$/i;

const SECTION_CATEGORIES = {
  heroes: ['heroes', 'hero-items', 'herofx'],
  world: ['terrains', 'trees', 'river', 'creeps', 'towers', 'roshan', 'ancient', 'tormentor', 'wards', 'couriers'],
  interface: ['backgrounds', 'huds', 'emblems', 'versus-screens', 'item-icons', 'ranks', 'pings', 'cursors', 'announcers', 'mega-kill', 'music', 'packs'],
  effects: ['shaders', 'ti-bp-effects', 'item-effects', 'ranged-attack', 'high-five', 'creep-deny'],
  other: ['optimization', 'other', 'sites', 'sounds', 'hero-sounds', 'pedestal'],
};

function languageFolderMatches(recordFolder, selectedFolder) {
  if (!recordFolder || !selectedFolder) return true;
  const record = String(recordFolder).toLowerCase();
  const selected = String(selectedFolder).toLowerCase();
  if (record === 'dota') return true;
  return record.replace(/^dota_/, '') === selected.replace(/^dota_/, '');
}

class AppService {
  constructor({ rootDir, onProgress = () => {} }) {
    this.rootDir = rootDir;
    this.storage = new JsonStorage(rootDir);
    this.savedPacks = new SavedPackStore({ rootDir });
    this.catalog = new CatalogClient({ rootDir });
    const dataParentDir = path.dirname(rootDir);
    const legacyRootDirs = ['VANTA', 'VANTA DOTA2 HUB', 'VANTA Dota'].map((name) => path.join(dataParentDir, name)).filter((directory) => directory !== rootDir);
    this.downloads = new DownloadManager(rootDir, onProgress, legacyRootDirs);
    this.activeVpkHashCache = null;
    this.gamePath = null;
    this.mods = new ModManager({ rootDir, storage: this.storage, downloads: this.downloads, getGamePath: () => this.gamePath, getLanguageFolder: () => this.storage.state.settings.langSuffix || 'dota', onProgress });
    this.heroGrids = new HeroGridService({ rootDir, storage: this.storage, getGamePath: () => this.gamePath, getLanguageFolder: () => this.storage.state.settings.langSuffix || 'russian' });
  }

  async init() {
    await this.storage.init();
    await this.savedPacks.init();
    await this.mods.init();
    this.gamePath = this.storage.state.settings.gamePath || null;
    if (!this.gamePath) {
      const found = await detectDota();
      if (found) this.gamePath = found.gamePath;
    }
    const catalog = await this.catalog.load();
    return this.snapshot(catalog);
  }

  getPackMembership() {
    const membership = {};
    for (const pack of Object.values(this.storage.state.installedMods || {})) {
      if (pack.type !== 'pack') continue;
      const packName = pack.displayName || pack.name || pack.id;
      const sourceIds = pack.sourceModIds || pack.modIds || (pack.packMods || []).map((mod) => mod.id || mod.modId).filter(Boolean);
      sourceIds.forEach((modId) => { membership[modId] = packName; });
    }
    return membership;
  }

  snapshot(catalog = { mods: this.catalog.mods, meta: this.catalog.meta }) {
    return { ...catalog, installed: this.storage.state.installedMods, packMembership: this.getPackMembership(), favorites: this.storage.state.favorites, settings: { ...this.storage.state.settings, discordAppId: DISCORD_APP_ID }, gamePath: this.gamePath, authors: this.getAuthors(), discordAppId: DISCORD_APP_ID };
  }

  getAuthors() {
    const authors = new Map();
    for (const mod of this.catalog.mods) {
      const rawName = mod.author || 'Unknown author';
      if (!rawName || /^anonymous$/i.test(rawName) || HIDDEN_AUTHORS.test(String(rawName).trim())) continue;
      const name = /^anonymous$/i.test(rawName) ? 'Community' : rawName;
      const profile = this.catalog.authors.find((item) => String(item.nick || item.displayName || '').toLowerCase() === name.toLowerCase()) || {};
      const avatarSeed = encodeURIComponent(name.toLowerCase());
      const avatarKey = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const avatarUrl = AUTHOR_AVATARS[avatarKey] || profile.photo || profile.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${avatarSeed}`;
      const authorKey = name.toLowerCase().trim();
      const keepAuthorLink = /^dota2pornfx$/i.test(name);
      const websiteUrl = (profile.website || profile.authorLink || '').toString().trim();
      const entry = authors.get(authorKey) || { id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), name, count: 0, mods: [], avatarUrl, authorLink: keepAuthorLink ? (websiteUrl || null) : null, links: profile.links || {}, bio: profile.bio || '' };
      entry.count += 1;
      entry.mods.push(mod.id);
      authors.set(authorKey, entry);
    }
    return [...authors.values()].sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  }

  async getCatalog({ query = '', category = 'all', section = 'all', author = '', hero = '', favoriteOnly = false, installedOnly = false, updatesOnly = false } = {}) {
    const mods = searchMods(this.catalog.mods, query, { category }).filter((mod) => {
      if (section !== 'all' && !(SECTION_CATEGORIES[section] || []).includes(mod.categoryId)) return false;
      if (author && mod.author.toLowerCase() !== author.toLowerCase()) return false;
      if (hero && mod.hero !== hero) return false;
      const installed = this.storage.state.installedMods[mod.id];
      if (favoriteOnly && !this.storage.state.favorites.includes(mod.id)) return false;
      if (installedOnly && !installed) return false;
      if (updatesOnly && (!installed || installed.version === mod.version)) return false;
      return true;
    });
    const categories = section === 'all' ? this.catalog.getCategories() : (SECTION_CATEGORIES[section] || []).filter((id) => this.catalog.mods.some((mod) => mod.categoryId === id));
    return { ...this.snapshot(), mods, categories, section, sections: SECTION_CATEGORIES };
  }

  async refreshCatalog() { return this.snapshot(await this.catalog.load({ force: true })); }
  async toggleFavorite(id) { const set = new Set(this.storage.state.favorites); set.has(id) ? set.delete(id) : set.add(id); await this.storage.patch({ favorites: [...set] }); return this.snapshot(); }
  async setGamePath(gamePath) { if (!(await validateDota(gamePath))) throw new Error('Selected folder is not a valid Dota 2 game directory'); this.gamePath = gamePath; await this.storage.patch({ settings: { ...this.storage.state.settings, gamePath } }); return this.snapshot(); }
  async detectGame() { const found = await detectDota(); if (found) await this.setGamePath(found.gamePath); return this.snapshot(); }
  async install(id) { const mod = this.catalog.getMod(id); if (!mod) throw new Error('Mod is not in the catalog'); await this.mods.install(mod); return this.snapshot(); }
  async update(id) { const mod = this.catalog.getMod(id); if (!mod) throw new Error('Mod is not in the catalog'); await this.mods.update(mod); return this.snapshot(); }
  async uninstall(id) { await this.mods.uninstall(id); return this.snapshot(); }
  async setModEnabled(id, enabled) { await this.mods.setEnabled(id, enabled); return this.snapshot(); }
  async mergeMods(ids, name) { await this.mods.merge(ids, name); return this.getLibrary(); }
  async reorderLibrary(ids) { await this.mods.reorder(ids); return this.snapshot(); }
  async renamePack(id, name) { await this.mods.renamePack(id, name); return this.getLibrary(); }
  async renameLibraryItem(id, name) { await this.mods.rename(id, name); return this.getLibrary(); }
  async rebuildPack(id) { await this.mods.rebuildPack(id); return this.getLibrary(); }
  async getHeroGrids() { return this.heroGrids.list(); }
  async diagnoseHeroGrid() { return this.heroGrids.diagnose(); }
  async getHeroGridUserGrids() { return this.heroGrids.userGrids(); }
  async applyHeroGrid(payload) { return this.heroGrids.apply(payload); }
  async disableHeroGrid() { return this.heroGrids.disable(); }
  async removeHeroGridUserGrids() { return this.heroGrids.removeUserGrids(); }
  async removeHeroGridUserGrid(index) { return this.heroGrids.removeUserGrid(index); }
  async importVpk(filePath, displayName) { await this.mods.importVpk(filePath, displayName); return this.getLibrary(); }
  async getLegacyOwnedFiles(languageFolder) {
    if (!this.gamePath) return [];
    const fs = require('fs/promises');
    const parentDir = path.dirname(this.rootDir);
    const manifestPaths = [
      path.join(this.rootDir, 'manifest.json'),
      path.join(this.rootDir, 'database', 'manifest.json'),
      path.join(parentDir, 'vanta-dota2-hub', 'manifest.json'),
      path.join(parentDir, 'VANTA DOTA2 HUB', 'manifest.json'),
    ];
    const owned = [];
    for (const manifestPath of manifestPaths) {
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        for (const record of manifest.installed || []) {
          for (const file of record.files || []) {
            if (file.root !== 'lang' || !file.relPath) continue;
            owned.push(path.join(this.gamePath, /^dota_/i.test(languageFolder) ? languageFolder : `dota_${languageFolder}`, file.relPath));
          }
        }
      } catch {}
    }
    return owned;
  }
  async importLegacyLibrary(languageFolder) {
    if (!this.gamePath) return;
    const fs = require('fs/promises');
    const targetRoot = path.join(this.gamePath, /^dota_/i.test(languageFolder) ? languageFolder : `dota_${languageFolder}`);
    const manifestPaths = [path.join(this.rootDir, 'manifest.json'), path.join(this.rootDir, 'database', 'manifest.json'), path.join(path.dirname(this.rootDir), 'vanta-dota2-hub', 'manifest.json'), path.join(path.dirname(this.rootDir), 'VANTA DOTA2 HUB', 'manifest.json')];
    const candidates = [];
    for (const manifestPath of manifestPaths) {
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        for (const record of manifest.installed || []) {
          const file = (record.files || []).find((entry) => entry.root === 'lang' && /\.vpk(?:\.off|\.moff)?$/i.test(entry.relPath || ''));
          if (!file) continue;
          const base = path.join(targetRoot, file.relPath);
          const exists = await Promise.all([base, base.replace(/\.(?:off|moff)$/i, ''), `${base}.off`, `${base}.moff`].map(async (candidate) => { try { await fs.access(candidate); return true; } catch { return false; } }));
          if (exists.some(Boolean)) candidates.push({ record, file: file.relPath });
        }
      } catch {}
    }
    try {
      for (const name of await fs.readdir(targetRoot)) if (/^pak(?:0[2-9]|[1-9]\d)_dir\.vpk(?:\.off|\.moff)?$/i.test(name)) candidates.push({ record: null, file: name });
    } catch {}
    const savedPacks = await this.savedPacks.list();
    const savedPackHashes = new Map();
    for (const pack of savedPacks) {
      const savedPath = path.join(this.savedPacks.directory, pack.id, pack.fileName || 'pack.vpk');
      try { savedPackHashes.set(await this.hashFile(savedPath), pack); } catch {}
    }
    const installedMods = { ...this.storage.state.installedMods };
    let changed = false;
    for (const [id, record] of Object.entries(installedMods)) {
      if (record.source !== 'legacy' && record.source !== 'saved-pack' || !record.targetRoot) continue;
      const base = path.join(record.targetRoot, record.gameFileName || record.deployedFileName || record.installedFiles?.[0] || '');
      const candidates = [base, base.replace(/\.(?:off|moff)$/i, ''), `${base}.off`, `${base}.moff`];
      let present = false;
      for (const candidate of candidates) { try { await fs.access(candidate); present = true; break; } catch {} }
      if (!present && record.source === 'legacy' || !present && record.source === 'saved-pack') { delete installedMods[id]; changed = true; }
    }
    for (const candidate of candidates) {
      const deployedFileName = candidate.file.replace(/\.(?:off|moff)$/i, '');
      const key = deployedFileName.toLowerCase();
      let savedPack = null;
      if (!/\.(?:off|moff)$/i.test(candidate.file)) {
        try { savedPack = savedPackHashes.get(await this.hashFile(path.join(targetRoot, candidate.file))) || null; } catch {}
      }
      const existing = Object.values(installedMods).find((mod) => mod.deployedFileName?.toLowerCase() === key || mod.gameFileName?.toLowerCase() === key || mod.fileName?.toLowerCase() === key);
      if (savedPack) {
        const id = existing?.id || `saved-library-${savedPack.id}`;
        installedMods[id] = { ...existing, id, modId: id, type: 'pack', source: 'saved-pack', savedPackId: savedPack.id, contentHash: savedPack.contentHash, displayName: savedPack.name, name: savedPack.name, category: 'Pack', categoryId: 'packs', languageFolder, targetRoot, deployedFileName, gameFileName: deployedFileName, fileName: candidate.file, installedFiles: [candidate.file], enabled: true, sourceMods: savedPack.sourceMods || [], packMods: savedPack.sourceMods || [], modIds: savedPack.modIds || [] };
        if (existing?.id !== id || existing?.type !== 'pack' || existing?.savedPackId !== savedPack.id || existing?.fileName !== candidate.file) changed = true;
        continue;
      }
      if (existing) continue;
      const id = `legacy-${Buffer.from(key).toString('hex').slice(0, 24)}`;
      installedMods[id] = { id, modId: id, type: 'mod', source: 'legacy', displayName: candidate.record?.name || deployedFileName.replace(/_dir\.vpk$/i, ''), name: candidate.record?.name || deployedFileName.replace(/_dir\.vpk$/i, ''), categoryId: candidate.record?.categoryId || 'other', previewUrl: candidate.record?.preview || null, languageFolder, targetRoot, deployedFileName, gameFileName: deployedFileName, installedFiles: [candidate.file], enabled: !/\.(?:off|moff)$/i.test(candidate.file), version: 'legacy', installedAt: candidate.record?.installedAt || new Date().toISOString() };
      changed = true;
    }
    if (changed) await this.storage.patch({ installedMods });
  }
  async getLibrary() { const languageFolder = this.storage.state.settings.langSuffix || 'russian'; if (!this.gamePath) { const found = await detectDota(); if (found) this.gamePath = found.gamePath; } await this.importLegacyLibrary(languageFolder); await this.mods.syncInstalled(); const allInstalled = Object.values(this.storage.state.installedMods); const installed = allInstalled.filter((mod) => languageFolderMatches(mod.languageFolder, languageFolder)); const ownedFiles = installed.flatMap((mod) => (mod.installedFiles || []).map((file) => path.join(mod.targetRoot || this.gamePath || '', mod.deployedFileName || mod.gameFileName || (mod.targetRoot ? file : path.join(mod.languageFolder || languageFolder, file))))); const legacyFiles = await this.getLegacyOwnedFiles(languageFolder); return { ...this.snapshot(), installed, external: await detectExternalFiles(this.gamePath, this.catalog.mods, languageFolder, ownedFiles, legacyFiles) }; }
  async getLanguageFolders() { if (!this.gamePath) return []; const fs = require('fs/promises'); const entries = await fs.readdir(this.gamePath, { withFileTypes: true }); return entries.filter((entry) => entry.isDirectory() && /^dota_/i.test(entry.name)).map((entry) => entry.name).sort(); }
  async openModsFolder() { if (!this.gamePath) throw new Error('Dota 2 installation is not configured'); const { spawn } = require('child_process'); const folder = path.join(this.gamePath, this.storage.state.settings.langSuffix || 'dota'); await require('fs/promises').mkdir(folder, { recursive: true }); const command = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open'; const args = process.platform === 'win32' ? [folder] : [folder]; try { const child = spawn(command, args, { detached: true, stdio: 'ignore' }); child.unref(); } catch (error) { try { const { shell } = require('electron'); void shell.openPath(folder).catch(() => {}); } catch {} } return folder; }
  async setExternalEnabled(relativePath, enabled) { if (!this.gamePath || !relativePath || relativePath.includes('..')) throw new Error('External file path is invalid'); const root = path.resolve(this.gamePath); const active = path.resolve(root, relativePath); const disabled = `${active}.vanta-disabled`; if (!active.startsWith(`${root}${path.sep}`)) throw new Error('External file path is outside the selected Dota folder'); const source = enabled ? [disabled, `${active}.off`, `${active}.moff`] : [active]; const target = enabled ? active : disabled; const exists = async (file) => { try { await require('fs/promises').access(file); return true; } catch { return false; } }; let existing = ''; for (const candidate of source) if (await exists(candidate)) { existing = candidate; break; } if (existing && path.resolve(existing) !== path.resolve(target)) await require('fs/promises').rename(existing, target); return this.getLibrary(); }
  async removeExternal(relativePath) { if (!this.gamePath || !relativePath || relativePath.includes('..')) throw new Error('External file path is invalid'); const root = path.resolve(this.gamePath); const active = path.resolve(root, relativePath); const disabled = `${active}.vanta-disabled`; if (!active.startsWith(`${root}${path.sep}`)) throw new Error('External file path is outside the selected Dota folder'); await require('fs/promises').rm(active, { force: true }); await require('fs/promises').rm(disabled, { force: true }); return this.getLibrary(); }
  recordId(record) { return record?.id || record?.modId || null; }
  async savePack(name, modIds) {
    const ids = Array.isArray(modIds) ? [...new Set(modIds.filter(Boolean).filter((id) => this.storage.state.installedMods[id]))] : [];
    if (!ids.length) throw new Error('Select at least one valid mod to save');
    await this.mods.merge(ids, name); return this.getLibrary();
  }
  async getSavedPacks() {
    const packs = await this.savedPacks.list();
    const items = [];
    for (const pack of packs) {
      const activeFile = await this.findActiveSavedPackFile(pack);
      const active = Boolean(activeFile);
      items.push({
        ...pack,
        modCount: pack.modCount || (Array.isArray(pack.modIds) ? pack.modIds.length : 0),
        active,
        activeFileName: activeFile?.fileName || null,
        activeContentHash: activeFile?.contentHash || null,
        status: active ? 'active' : 'inactive',
      });
    }
    return items;
  }
  async listSavedPacks() { return { ...this.snapshot(), savedPacks: await this.getSavedPacks() }; }
  async activateSavedPack(id) {
    const pack = await this.savedPacks.get(id);
    if (!pack) throw new Error('Saved pack not found');
    if (!this.gamePath) throw new Error('Dota 2 installation is not configured');
    const targetRoot = this.getLanguageRoot();
    await fs.mkdir(targetRoot, { recursive: true });
    const sourcePath = path.join(this.savedPacks.directory, id, 'pack.vpk');
    if (!await this.savedPacks.exists(sourcePath)) throw new Error('Saved pack VPK file is missing');
    const sourceHash = await this.hashFile(sourcePath);
    const activeFile = await this.findActiveSavedPackFile({ ...pack, contentHash: sourceHash });
    if (activeFile) {
      await this.savedPacks.update(id, { installedFileName: activeFile.fileName, contentHash: sourceHash });
      return this.listSavedPacks();
    }
    const candidate = await this.mods.library.getNextAvailablePakFilename(pack.installedFileName || null);
    const finalPath = path.join(targetRoot, candidate);
    if (await this.exists(finalPath)) {
      const targetHash = await this.hashFile(finalPath);
      if (sourceHash !== targetHash) {
        throw new Error('A different VPK already occupies the target slot');
      }
    } else {
      await fs.copyFile(sourcePath, finalPath);
    }
    await this.savedPacks.update(id, { installedFileName: candidate, contentHash: sourceHash, updatedAt: new Date().toISOString() });
    await this.getLibrary();
    return this.listSavedPacks();
  }
  async saveSavedPack({ name, packId, modIds }) {
    const sourcePack = packId ? this.storage.state.installedMods[packId] : null;
    if (packId && (!sourcePack || sourcePack.type !== 'pack')) throw new Error('Library pack not found');
    const ids = sourcePack ? (sourcePack.sourceModIds || sourcePack.modIds || []).filter(Boolean) : Array.isArray(modIds) ? [...new Set(modIds.filter(Boolean).filter((id) => this.storage.state.installedMods[id]))] : [];
    if (!sourcePack && !ids.length) throw new Error('Selected mods are no longer available in the library');
    const chosen = sourcePack ? [] : ids.map((id) => this.storage.state.installedMods[id]).filter(Boolean);
    const safeName = String(name || '').trim();
    if (!safeName) throw new Error('Saved pack name is required');
    const existing = (await this.savedPacks.list()).find((pack) => pack.name.toLowerCase() === safeName.toLowerCase());
    if (existing) throw new Error('A saved pack with this name already exists');
    let archivePath;
    let sourceMods = chosen.map((record) => ({ id: this.recordId(record), displayName: record.displayName || record.name, name: record.displayName || record.name, hero: record.hero, heroLabel: record.heroLabel, slot: record.slot }));
    if (sourcePack) {
      const fileName = sourcePack.fileName || (sourcePack.installedFiles || []).find((file) => /\.vpk$/i.test(file));
      archivePath = fileName ? path.join(this.mods.library.directory, fileName) : null;
      if (!archivePath) throw new Error('Pack VPK file is missing from the library');
      const stat = await fs.stat(archivePath).catch(() => null);
      if (!stat || !stat.isFile() || stat.size <= 0) throw new Error('Pack VPK file is missing from the library');
      sourceMods = sourcePack.sourceMods || sourcePack.packMods || [];
    } else {
      archivePath = path.join(this.rootDir, 'database', '.tmp-saved-pack.vpk');
      await this.writeSavedPackArchive(archivePath, chosen);
    }
    try {
      const contentHash = await this.hashFile(archivePath);
      const savedCopies = await this.savedPacks.list();
      for (const savedCopy of savedCopies) {
        const savedCopyPath = path.join(this.savedPacks.directory, savedCopy.id, savedCopy.fileName || 'pack.vpk');
        try {
          if ((savedCopy.contentHash || await this.hashFile(savedCopyPath)) === contentHash) return this.listSavedPacks();
        } catch {}
      }
      await this.savedPacks.save({ name: safeName, modIds: ids, sourceMods, sourcePackId: sourcePack?.id || null, sourceFileName: sourcePack?.fileName || null, contentHash, archivePath });
    } finally {
      if (!sourcePack) await fs.rm(archivePath, { force: true });
    }
    return this.listSavedPacks();
  }
  async renameSavedPack(id, name) {
    const safeName = String(name || '').trim();
    if (!safeName) throw new Error('Saved pack name is required');
    const existing = (await this.savedPacks.list()).find((pack) => String(pack.id) !== String(id) && pack.name.toLowerCase() === safeName.toLowerCase());
    if (existing) throw new Error('A saved pack with this name already exists');
    await this.savedPacks.rename(id, safeName);
    return this.listSavedPacks();
  }
  async deleteSavedPack(id) {
    const pack = await this.savedPacks.get(id);
    if (!pack) throw new Error('Saved pack not found');
    await this.savedPacks.remove(id);
    return this.listSavedPacks();
  }
  async deletePack(id) { await this.mods.uninstall(id); return this.getLibrary(); }
  async hashFile(filePath) {
    if (!filePath) return null;
    const data = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  async exists(filePath) {
    try { await fs.access(filePath); return true; } catch { return false; }
  }
  getLanguageRoot() {
    const languageFolder = this.storage.state.settings.langSuffix || 'dota';
    return path.join(this.gamePath, /^dota_/i.test(languageFolder) ? languageFolder : `dota_${languageFolder}`);
  }
  async findActiveSavedPackFile(pack) {
    const savedPath = pack && path.join(this.savedPacks.directory, pack.id, pack.fileName || 'pack.vpk');
    if (!pack || !this.gamePath || !savedPath || !(await this.exists(savedPath))) return null;
    const sourceHash = pack.contentHash || await this.hashFile(savedPath);
    const preferredName = pack.installedFileName;
    if (preferredName && /^pak\d{2}_dir\.vpk$/i.test(preferredName)) {
      const preferredPath = path.join(this.getLanguageRoot(), preferredName);
      if (await this.exists(preferredPath) && await this.hashFile(preferredPath) === sourceHash) return { fileName: preferredName, contentHash: sourceHash, path: preferredPath };
    }
    const activeFiles = await this.getActiveVpkHashes();
    const match = activeFiles.get(sourceHash);
    if (match) return { fileName: match.fileName, contentHash: sourceHash, path: match.path };
    return null;
  }
  async getActiveVpkHashes() {
    const root = this.getLanguageRoot();
    let entries;
    try { entries = await fs.readdir(root, { withFileTypes: true }); } catch { return new Map(); }
    const candidates = entries.filter((entry) => entry.isFile() && /^pak\d{2}_dir\.vpk$/i.test(entry.name));
    const signature = JSON.stringify(await Promise.all(candidates.map(async (entry) => { const stat = await fs.stat(path.join(root, entry.name)); return [entry.name, stat.size, stat.mtimeMs]; })));
    if (this.activeVpkHashCache?.root === root && this.activeVpkHashCache.signature === signature) return this.activeVpkHashCache.hashes;
    const hashes = new Map();
    for (const entry of candidates) {
      const candidatePath = path.join(root, entry.name);
      hashes.set(await this.hashFile(candidatePath), { fileName: entry.name, path: candidatePath });
    }
    this.activeVpkHashCache = { root, signature, hashes };
    return hashes;
  }
  async getSavedPackContents(id) {
    const pack = await this.savedPacks.get(id);
    if (!pack) throw new Error('Saved pack not found');
    return this.readPackContents(path.join(this.savedPacks.directory, id, pack.fileName || 'pack.vpk'), { ...pack, source: 'saved', name: pack.name });
  }
  async getLibraryPackContents(id) {
    const pack = this.storage.state.installedMods[id];
    if (!pack || pack.type !== 'pack') throw new Error('Library pack not found');
    const sourcePath = pack.targetRoot ? path.join(pack.targetRoot, pack.deployedFileName || pack.gameFileName || pack.fileName) : path.join(this.mods.library.directory, pack.fileName);
    return this.readPackContents(sourcePath, { ...pack, source: 'library', name: pack.displayName || pack.name });
  }
  async readPackContents(sourcePath, pack) {
    const stat = await fs.stat(sourcePath).catch(() => null);
    if (!stat || !stat.isFile() || stat.size <= 0) throw new Error('Pack VPK file is missing');
    const reader = VpkReader.open(sourcePath);
    try {
      return { ...pack, filePath: sourcePath, contentHash: await this.hashFile(sourcePath), files: reader.files(), sourceMods: pack.sourceMods || pack.packMods || [] };
    } catch (error) {
      throw new Error(`Pack VPK file is invalid: ${error.message}`);
    } finally { reader.close(); }
  }
  async writeSavedPackArchive(archivePath, chosenRecords) {
    const writer = new VpkWriter();
    const mergedFiles = new Map();
    for (const record of chosenRecords) {
      const source = path.join(this.mods.library.directory, record.fileName);
      if (!await this.exists(source)) throw new Error(`Saved pack source VPK is missing: ${record.fileName}`);
      const reader = VpkReader.open(source);
      try {
        for (const file of reader.files()) mergedFiles.set(file, reader.readFile(file));
      } finally { reader.close(); }
    }
    for (const [file, data] of mergedFiles) writer.addFile(file, data);
    await fs.mkdir(path.dirname(archivePath), { recursive: true });
    writer.write(archivePath);
  }
  async cancelDownload(id) { return this.downloads.cancel(id); }
  async clearDownloadArchives() { await this.downloads.clear(); return this.snapshot(); }
  async getDownloadArchiveStats() { return this.downloads.getStats(); }
  getSettings() { return this.snapshot().settings; }
  async setSetting(key, value) {
    if (key === 'langSuffix' && value !== this.storage.state.settings.langSuffix) await this.mods.moveInstalledMods(value);
    await this.storage.patch({ settings: { ...this.storage.state.settings, [key]: value } });
    return this.snapshot();
  }
}

module.exports = { AppService };