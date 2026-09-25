const fs = require('fs/promises');
const path = require('path');
const crypto = require('node:crypto');
const AdmZip = require('adm-zip');
const { VpkReader, VpkWriter } = require('vpk-tools');
const { VpkLibrary, isPakFilename, pakFilename, FIRST_PAK_NUMBER } = require('../infrastructure/vpk-library');

async function hashFile(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

function safeRelative(value) {
  const normalized = String(value).replace(/\\/g, '/');
  if (!normalized || normalized.startsWith('/') || normalized.includes('..')) throw new Error('Archive contains an unsafe path');
  return normalized;
}

async function safeRename(source, target) {
  if (!source || !target) return;
  if (path.resolve(source) === path.resolve(target)) return;
  await fs.rename(source, target);
}

class ModManager {
  constructor({ rootDir, storage, downloads, getGamePath, getLanguageFolder = () => 'dota', onProgress = () => {} }) {
    this.rootDir = rootDir;
    this.storage = storage;
    this.downloads = downloads;
    this.getGamePath = getGamePath;
    this.getLanguageFolder = getLanguageFolder;
    this.onProgress = onProgress;
    this.library = new VpkLibrary({ rootDir, storage });
  }

  async init() { await this.library.init(); await this.migrateLegacyRecords(); }

  async migrateLegacyRecords() {
    const installedMods = { ...this.storage.state.installedMods };
    let changed = false;
    for (const [id, record] of Object.entries(installedMods)) {
      if (record.fileName && isPakFilename(record.fileName)) continue;
      const legacyFile = (record.installedFiles || []).find((file) => /\.vpk(?:\.off|\.moff)?$/i.test(String(file)));
      if (!legacyFile) continue;
      const sourceBase = path.resolve(record.targetRoot || '', legacyFile);
      const source = await this.firstExisting([sourceBase, sourceBase.replace(/\.(?:off|moff)$/i, ''), `${sourceBase}.off`, `${sourceBase}.moff`]);
      if (!await this.exists(source)) continue;
      const reservation = await this.library.reserveFileName();
      try {
        await fs.copyFile(source, reservation.path);
        installedMods[id] = { ...record, id: record.id || id, modId: record.modId || id, displayName: record.displayName || record.name || id, fileName: reservation.fileName, deployedFileName: record.deployedFileName || legacyFile.replace(/\.(?:off|moff)$/i, ''), gameFileName: record.gameFileName || legacyFile.replace(/\.(?:off|moff)$/i, ''), installedFiles: [reservation.fileName], type: record.type || 'mod' };
        changed = true;
      } finally { await reservation.release(); }
    }
    if (changed) await this.storage.patch({ installedMods });
  }

  recordId(record) { return record.id || record.modId; }

  getPriorityValue(record) {
    if (record?.priority !== undefined && record.priority !== null && Number.isFinite(Number(record.priority))) return Number(record.priority);
    const match = String(record?.fileName || '').match(/pak(\d{2})_dir\.vpk/i);
    if (match) return Number.parseInt(match[1], 10);
    return FIRST_PAK_NUMBER;
  }

  async reorder(ids) {
    if (!Array.isArray(ids) || !ids.length) return [];
    const installedMods = this.storage.state.installedMods || {};
    const orderedIds = ids.filter(Boolean);
    const records = Object.values(installedMods).filter((record) => record && (record.type === 'mod' || record.type === 'pack') && record.fileName);
    const seen = new Set();
    const targetRecords = [];
    for (const id of orderedIds) {
      const record = installedMods[id];
      if (record && record.fileName && !seen.has(this.recordId(record))) {
        seen.add(this.recordId(record));
        targetRecords.push(record);
      }
    }
    for (const record of records) {
      const recordId = this.recordId(record);
      if (!seen.has(recordId)) targetRecords.push(record);
    }
    if (!targetRecords.length) return [];

    const renameMoves = [];
    const staleTargetBackups = [];
    const expectedHashes = new Map();
    const tempPaths = new Map();
    const tempGamePaths = new Map();

    const moveStaleTargetAside = async (targetPath) => {
      if (!targetPath || !(await this.exists(targetPath))) return false;
      const backupPath = path.join(path.dirname(targetPath), `._vanta_reorder_stale_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${path.basename(targetPath)}`);
      await fs.rename(targetPath, backupPath);
      renameMoves.push({ from: targetPath, to: backupPath });
      staleTargetBackups.push(backupPath);
      return true;
    };

    const finalPlan = targetRecords.map((record, index) => {
      const targetFileName = pakFilename(index + FIRST_PAK_NUMBER);
      return { record, targetFileName, index };
    });

    const validateNoConflicts = () => {
      const seenTargets = new Set();
      for (const item of finalPlan) {
        if (seenTargets.has(item.targetFileName)) throw new Error(`Duplicate reorder target: ${item.targetFileName}`);
        seenTargets.add(item.targetFileName);
      }
    };

    const rollback = async () => {
      for (const move of [...renameMoves].reverse()) {
        try {
          if (move.to && await this.exists(move.to)) {
            await fs.rename(move.to, move.from);
          }
        } catch (error) {
          console.error('[mod:reorder:rollback]', error);
        }
      }
    };

    try {
      validateNoConflicts();
      for (const { record, targetFileName, index } of finalPlan) {
        const librarySource = path.join(this.library.directory, record.fileName);
        const targetRoot = record.targetRoot || (this.getGamePath() && path.join(this.getGamePath(), record.languageFolder || this.getLanguageFolder() || 'dota'));
        const currentGameFile = record.gameFileName || record.fileName;
        const gameSource = targetRoot ? path.join(targetRoot, currentGameFile) : '';

        let snapshot = await this.fileSnapshot(librarySource);
        if (!snapshot.exists && gameSource && await this.exists(gameSource)) {
          await fs.copyFile(gameSource, librarySource);
          snapshot = await this.fileSnapshot(librarySource);
        }
        if (!snapshot.exists) throw new Error(`Missing library VPK before reorder: ${record.fileName}`);
        expectedHashes.set(this.recordId(record), snapshot.hash);
        const tempLibraryPath = path.join(this.library.directory, `._vanta_reorder_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}.tmp`);
        if (await this.exists(librarySource)) {
          await fs.rename(librarySource, tempLibraryPath);
          renameMoves.push({ from: librarySource, to: tempLibraryPath });
        }
        tempPaths.set(this.recordId(record), tempLibraryPath);

        if (targetRoot) {
          if (await this.exists(gameSource)) {
            const tempGamePath = path.join(targetRoot, `._vanta_reorder_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}.tmp`);
            await fs.rename(gameSource, tempGamePath);
            renameMoves.push({ from: gameSource, to: tempGamePath });
            tempGamePaths.set(this.recordId(record), { from: gameSource, to: tempGamePath, final: path.join(targetRoot, targetFileName) });
          }
        }
      }

      for (const { record, targetFileName } of finalPlan) {
        const libraryTarget = path.join(this.library.directory, targetFileName);
        await moveStaleTargetAside(libraryTarget);
        const targetRoot = record.targetRoot || (this.getGamePath() && path.join(this.getGamePath(), record.languageFolder || this.getLanguageFolder() || 'dota'));
        if (targetRoot) {
          const gameTarget = path.join(targetRoot, targetFileName);
          await moveStaleTargetAside(gameTarget);
        }
      }

      for (const { record, targetFileName } of finalPlan) {
        const id = this.recordId(record);
        const libraryTemp = tempPaths.get(id);
        const libraryTarget = path.join(this.library.directory, targetFileName);
        if (!libraryTemp || !(await this.exists(libraryTemp))) throw new Error(`Missing temporary library VPK for reorder: ${id}`);
        await fs.rename(libraryTemp, libraryTarget);
        renameMoves.push({ from: libraryTemp, to: libraryTarget });

        const targetRoot = record.targetRoot || (this.getGamePath() && path.join(this.getGamePath(), record.languageFolder || this.getLanguageFolder() || 'dota'));
        const gameTempInfo = tempGamePaths.get(id);
        if (targetRoot && gameTempInfo) {
          const gameTarget = path.join(targetRoot, targetFileName);
          await fs.rename(gameTempInfo.to, gameTarget);
          renameMoves.push({ from: gameTempInfo.to, to: gameTarget });
        }

        const actualHash = await hashFile(libraryTarget);
        if (expectedHashes.get(id) !== actualHash) {
          throw new Error(`VPK payload changed during reorder for ${record.fileName}`);
        }
      }

      const updates = {};
      for (const [index, { record, targetFileName }] of finalPlan.entries()) {
        const nextRecord = { ...record, fileName: targetFileName, gameFileName: targetFileName, installedFiles: [targetFileName], priority: index + FIRST_PAK_NUMBER };
        updates[this.recordId(record)] = nextRecord;
        await this.writeManifest(nextRecord);
      }

      for (const backupPath of staleTargetBackups) {
        await fs.rm(backupPath, { force: true });
      }

      await this.storage.patch({ installedMods: { ...installedMods, ...updates } });
      return Object.values(this.storage.state.installedMods).sort((left, right) => this.getPriorityValue(left) - this.getPriorityValue(right));
    } catch (error) {
      await rollback();
      throw error;
    }
  }

  async install(mod) {
    await this.library.init();
    await this.migrateLegacyRecords();
    const archive = await this.downloads.download(mod.id, mod.downloadUrl);
    const downloaded = await fs.readFile(archive);
    const directVpk = downloaded.length >= 4 && downloaded.readUInt32LE(0) === 0x55aa1234;
    let vpkData = downloaded;
    if (!directVpk) {
      let zip;
      try { zip = new AdmZip(downloaded); } catch (error) { throw new Error(`Downloaded mod is not a valid ZIP or VPK: ${error.message}`); }
      const vpkEntry = zip.getEntries().find((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.vpk'));
      if (!vpkEntry) throw new Error('Download archive contained no VPK file');
      vpkData = vpkEntry.getData();
    }
    const previous = this.storage.state.installedMods[mod.id];
    const reservation = await this.library.reserveFileName(previous?.fileName || null);
    const temporary = `${reservation.path}.part`;
    const backup = `${reservation.path}.backup`;
    try {
      await fs.writeFile(temporary, vpkData);
      await this.validateVpk(temporary);
      if (await this.exists(reservation.path)) await fs.rename(reservation.path, backup);
      await fs.rename(temporary, reservation.path);
      const record = this.createModRecord(mod, previous, reservation.fileName);
      await this.deploy(record);
      await this.writeManifest(record);
      await this.storage.patch({ installedMods: { ...this.storage.state.installedMods, [mod.id]: record } });
      await fs.rm(backup, { force: true });
      return record;
    } catch (error) {
      await fs.rm(temporary, { force: true });
      await fs.rm(reservation.path, { force: true });
      if (await this.exists(backup)) await fs.rename(backup, reservation.path);
      throw error;
    }
    finally { await reservation.release(); }
  }

  createModRecord(mod, previous, fileName) {
    const languageFolder = this.getLanguageFolder() || 'dota';
    return { ...previous, id: mod.id, modId: mod.id, type: 'mod', displayName: mod.name, name: mod.name, fileName, author: mod.author, categoryId: mod.categoryId, hero: mod.hero, heroLabel: mod.heroLabel, slot: mod.slot, previewUrl: mod.previewUrl, languageFolder, version: mod.version, installedAt: previous?.installedAt || new Date().toISOString(), installedFiles: [fileName], enabled: previous?.enabled !== false, priority: previous?.priority || this.getPriorityValue({ fileName }) };
  }

  async update(mod) { return this.install(mod); }

  async importVpk(filePath, displayName = path.basename(filePath, path.extname(filePath))) {
    const reservation = await this.library.reserveFileName();
    const temporary = `${reservation.path}.part`;
    try {
      await fs.copyFile(filePath, temporary);
      await this.validateVpk(temporary);
      await fs.rename(temporary, reservation.path);
      const id = `import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const name = String(displayName).trim() || 'Imported VPK';
      const record = { id, modId: id, type: 'mod', displayName: name, name, fileName: reservation.fileName, installedFiles: [reservation.fileName], categoryId: 'other', languageFolder: this.getLanguageFolder() || 'dota', version: 'imported', installedAt: new Date().toISOString(), enabled: false, priority: this.getPriorityValue({ fileName: reservation.fileName }) };
      await this.writeManifest(record);
      await this.storage.patch({ installedMods: { ...this.storage.state.installedMods, [id]: record } });
      return record;
    } catch (error) { await fs.rm(temporary, { force: true }); throw error; }
    finally { await reservation.release(); }
  }

  async deploy(record) {
    const gamePath = this.getGamePath();
    if (!gamePath) throw new Error('Dota 2 installation is not configured');
    const targetRoot = this.getLanguageRoot(record.languageFolder);
    await fs.mkdir(targetRoot, { recursive: true });
    await fs.copyFile(path.join(this.library.directory, record.fileName), path.join(targetRoot, record.gameFileName || record.fileName));
    return { ...record, targetRoot, installedFiles: [record.fileName] };
  }

  getLanguageRoot(languageFolder = this.getLanguageFolder()) {
    const gamePath = this.getGamePath();
    if (!gamePath) return null;
    const folder = String(languageFolder || 'dota');
    return path.join(gamePath, /^dota_/i.test(folder) || folder.toLowerCase() === 'dota' ? folder : `dota_${folder}`);
  }

  async moveInstalledMods(languageFolder) {
    const gamePath = this.getGamePath();
    const installedMods = this.storage.state.installedMods || {};
    if (!gamePath) return installedMods;
    const targetRoot = this.getLanguageRoot(languageFolder);
    const moves = [];
    for (const record of Object.values(installedMods)) {
      if (!record?.fileName) continue;
      const sourceRoot = record.targetRoot || this.getLanguageRoot(record.languageFolder);
      const fileName = record.gameFileName || record.deployedFileName || record.fileName;
      if (!sourceRoot || !fileName || path.resolve(sourceRoot) === path.resolve(targetRoot)) continue;
      const source = await this.firstExisting([fileName, `${fileName}.vanta-disabled`, `${fileName}.off`, `${fileName}.moff`].map((name) => path.join(sourceRoot, name)));
      if (source) moves.push({ record, source, target: path.join(targetRoot, path.basename(source)) });
    }
    for (const move of moves) {
      if (await this.exists(move.target)) throw new Error(`Cannot move mod because the target file already exists: ${path.basename(move.target)}`);
    }
    await fs.mkdir(targetRoot, { recursive: true });
    for (const move of moves) await fs.rename(move.source, move.target);
    const updatedMods = { ...installedMods };
    for (const record of Object.values(installedMods)) {
      if (!record?.fileName) continue;
      const next = { ...record, languageFolder, targetRoot };
      updatedMods[this.recordId(record)] = next;
      await this.writeManifest(next);
    }
    await this.storage.patch({ installedMods: updatedMods });
    return updatedMods;
  }

  async syncInstalled() { await this.library.init(); await this.migrateLegacyRecords(); return this.storage.state.installedMods; }

  async uninstall(id) {
    const record = this.storage.state.installedMods[id];
    if (!record) throw new Error('Library item not found');
    const targetRoot = record.targetRoot || this.getLanguageRoot(record.languageFolder);
    const gameFileName = record.gameFileName || record.fileName;
    if (targetRoot && gameFileName) { await fs.rm(path.join(targetRoot, gameFileName), { force: true }); await fs.rm(path.join(targetRoot, `${gameFileName}.vanta-disabled`), { force: true }); await fs.rm(path.join(targetRoot, `${gameFileName}.off`), { force: true }); await fs.rm(path.join(targetRoot, `${gameFileName}.moff`), { force: true }); }
    if (record.fileName) await fs.rm(path.join(this.library.directory, record.fileName), { force: true });
    await fs.rm(path.join(this.rootDir, 'database', 'manifests', `${id}.json`), { force: true });
    const installedMods = { ...this.storage.state.installedMods }; delete installedMods[id];
    await this.storage.patch({ installedMods });
    return true;
  }

  async setEnabled(id, enabled) {
    const record = this.storage.state.installedMods[id];
    if (!record || !record.fileName) throw new Error('Library item not found');
    const gamePath = this.getGamePath();
    if (!gamePath) throw new Error('Dota 2 installation is not configured');
    const targetRoot = this.getLanguageRoot(record.languageFolder);
    await fs.mkdir(targetRoot, { recursive: true });
    const gameFileName = record.gameFileName || record.fileName;
    const active = path.join(targetRoot, gameFileName); const disabled = `${active}.vanta-disabled`;
    const legacyDisabled = [`${active}.off`, `${active}.moff`];
    if (enabled) { let legacy = ''; for (const file of legacyDisabled) if (await this.exists(file)) { legacy = file; break; } if (await this.exists(disabled)) await safeRename(disabled, active); else if (legacy) await safeRename(legacy, active); else if (!await this.exists(active)) await this.deploy(record); }
    else if (await this.exists(active)) await safeRename(active, disabled);
    const next = { ...record, enabled }; await this.writeManifest(next);
    await this.storage.patch({ installedMods: { ...this.storage.state.installedMods, [id]: next } });
    return next;
  }

  async merge(ids, name) {
    const validIds = Array.isArray(ids) ? [...new Set(ids.filter(Boolean).filter((id) => this.storage.state.installedMods[id]))] : [];
    if (validIds.length < 2) throw new Error('Select at least two valid mods to merge');
    await this.library.init(); await this.migrateLegacyRecords(); return this.buildPack(validIds, name);
  }

  async rebuildPack(id) {
    const pack = this.storage.state.installedMods[id];
    if (!pack || pack.type !== 'pack') throw new Error('Pack not found');
    const ids = pack.sourceModIds || (pack.packMods || []).map((mod) => mod.id || mod.modId).filter(Boolean);
    if (ids.length < 2) throw new Error('Pack has no rebuildable source mods');
    const missing = ids.filter((sourceId) => !this.storage.state.installedMods[sourceId]);
    if (missing.length) throw new Error(`Cannot rebuild Pack: source mods are no longer in Library. Download them again first: ${missing.join(', ')}`);
    return this.buildPack(ids, pack.displayName || pack.name, pack);
  }

  async buildPack(ids, name, previousPack = null) {
    const records = ids.map((id) => this.storage.state.installedMods[id]).filter(Boolean);
    if (records.length !== ids.length || records.length < 2) throw new Error('Selected Library mods were not found');
    const displayName = String(name || '').trim(); if (!displayName) throw new Error('Pack name is required');
    const reservation = await this.library.reserveFileName(previousPack?.fileName || null); const temporary = `${reservation.path}.part`;
    try {
      const progressId = previousPack?.id || 'library';
      this.onProgress({ id: progressId, state: 'processing', phase: 'Reading mods...', percent: 5 });
      const writer = new VpkWriter(); const mergedFiles = new Map();
      for (const [index, record] of records.entries()) {
        this.onProgress({ id: progressId, state: 'processing', phase: `Reading mod ${index + 1} of ${records.length}...`, percent: 10 + Math.round((index / records.length) * 55) });
        const source = path.join(this.library.directory, record.fileName);
        if (!await this.exists(source)) throw new Error(`Source VPK is missing: ${record.fileName}`);
        const reader = VpkReader.open(source);
        try { for (const file of reader.files()) mergedFiles.set(file, reader.readFile(file)); } finally { reader.close(); }
        this.onProgress({ id: progressId, state: 'processing', phase: `Read mod ${index + 1} of ${records.length}`, percent: 10 + Math.round(((index + 1) / records.length) * 55) });
      }
      this.onProgress({ id: progressId, state: 'processing', phase: 'Resolving conflicts...', percent: 70 });
      for (const [file, data] of mergedFiles) writer.addFile(file, data);
      this.onProgress({ id: progressId, state: 'processing', phase: 'Building VPK...', percent: 82 });
      writer.write(temporary); await this.validateVpk(temporary); await fs.rename(temporary, reservation.path);
      const packId = previousPack?.id || `pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const sourceMods = records.flatMap((record) => record.type === 'pack' ? (record.sourceMods || record.packMods || []) : [{ id: this.recordId(record), name: record.displayName || record.name, displayName: record.displayName || record.name, fileName: record.fileName, author: record.author, previewUrl: record.previewUrl, hero: record.hero, heroLabel: record.heroLabel, slot: record.slot }]);
      const sourceModIds = sourceMods.map((source) => source.id || source.modId).filter(Boolean);
      const pack = { ...previousPack, id: packId, modId: packId, type: 'pack', category: 'Pack', displayName, name: displayName, fileName: reservation.fileName, categoryId: 'packs', languageFolder: records[0].languageFolder || this.getLanguageFolder() || 'dota', version: 'merged', updatedAt: new Date().toISOString(), installedFiles: [reservation.fileName], enabled: previousPack ? previousPack.enabled !== false : true, sourceModIds, sourceMods, modIds: sourceModIds, packMods: sourceMods };
      await this.writeManifest(pack);
      if (pack.enabled) await this.deploy(pack);
      const installedMods = { ...this.storage.state.installedMods, [packId]: pack };
      for (const record of records) {
        const targetRoot = record.targetRoot || (this.getGamePath() && path.join(this.getGamePath(), record.languageFolder || this.getLanguageFolder() || 'dota'));
        if (targetRoot && record.fileName) {
          await fs.rm(path.join(targetRoot, record.fileName), { force: true });
          await fs.rm(path.join(targetRoot, `${record.fileName}.vanta-disabled`), { force: true });
        }
        await fs.rm(path.join(this.library.directory, record.fileName), { force: true });
        await fs.rm(path.join(this.rootDir, 'database', 'manifests', `${this.recordId(record)}.json`), { force: true });
        delete installedMods[this.recordId(record)];
      }
      await this.storage.patch({ installedMods });
      this.onProgress({ id: packId, state: 'processing', phase: 'Finalizing Pack...', percent: 96 });
      this.onProgress({ id: packId, state: 'completed', phase: 'Pack created', percent: 100 });
      return pack;
    } catch (error) {
      await fs.rm(temporary, { force: true });
      this.onProgress({ id: previousPack?.id || 'library', state: 'failed', phase: error.message });
      throw error;
    }
    finally { await reservation.release(); }
  }

  async rename(id, name) {
    const nextName = String(name || '').trim(); if (!nextName) throw new Error('Library name is required');
    const record = this.storage.state.installedMods[id]; if (!record) throw new Error('Library item not found');
    const next = { ...record, displayName: nextName, name: nextName }; await this.writeManifest(next);
    await this.storage.patch({ installedMods: { ...this.storage.state.installedMods, [id]: next } }); return next;
  }

  async renamePack(id, name) { return this.rename(id, name); }

  async writeManifest(record) { const manifests = path.join(this.rootDir, 'database', 'manifests'); await fs.mkdir(manifests, { recursive: true }); await fs.writeFile(path.join(manifests, `${this.recordId(record)}.json`), JSON.stringify(record, null, 2)); }

  async validateVpk(file) { const reader = VpkReader.open(file); try { if (!reader.files().length) throw new Error('VPK contains no files'); } finally { reader.close(); } }

  async exists(file) { try { await fs.access(file); return true; } catch { return false; } }
  async fileSnapshot(filePath) {
    if (!filePath) return { exists: false, size: 0, hash: null };
    const exists = await this.exists(filePath);
    if (!exists) return { exists: false, size: 0, hash: null };
    const stats = await fs.stat(filePath);
    return { exists: true, size: stats.size, hash: await hashFile(filePath) };
  }
  async firstExisting(files) { for (const file of files) if (await this.exists(file)) return file; return ''; }
}

module.exports = { ModManager, safeRelative };