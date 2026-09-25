const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('node:crypto');
const { JsonStorage } = require('../src/infrastructure/storage');
const { VpkLibrary } = require('../src/infrastructure/vpk-library');
const { ModManager } = require('../src/application/mod-manager');

async function listVpkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile() && /\.vpk$/i.test(entry.name)).map((entry) => entry.name).sort();
}

async function fileHash(filePath) {
  const data = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function createLibraryFixture(root, idToContentMap) {
  const storage = new JsonStorage(root); await storage.init();
  const libraryDir = path.join(root, 'database', 'library');
  const gameDir = path.join(root, 'game', 'dota');
  await fs.mkdir(libraryDir, { recursive: true });
  await fs.mkdir(gameDir, { recursive: true });
  const records = {};
  const orderedIds = Object.keys(idToContentMap);
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    const content = idToContentMap[id];
    const fileName = `pak${String(index + 2).padStart(2, '0')}_dir.vpk`;
    const filePath = path.join(libraryDir, fileName);
    const gameFilePath = path.join(gameDir, fileName);
    await fs.writeFile(filePath, content);
    await fs.writeFile(gameFilePath, content);
    records[id] = { id, modId: id, type: 'mod', displayName: id, name: id, fileName, gameFileName: fileName, installedFiles: [fileName], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: index + 2 };
  }
  await storage.patch({ installedMods: records });
  return { storage, gameDir, libraryDir, records };
}

test('allocator chooses the first free slot and reuses gaps', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-pak-'));
  const storage = new JsonStorage(root); await storage.init();
  await storage.patch({ installedMods: { one: { fileName: 'pak02_dir.vpk' }, two: { fileName: 'pak03_dir.vpk' }, five: { fileName: 'pak05_dir.vpk' } } });
  const library = new VpkLibrary({ rootDir: root, storage }); await library.init();
  assert.equal(await library.getNextAvailablePakFilename(), 'pak04_dir.vpk');
  await fs.writeFile(path.join(root, 'database', 'library', 'pak04_dir.vpk'), 'physical');
  assert.equal(await library.getNextAvailablePakFilename(), 'pak06_dir.vpk');
  delete storage.state.installedMods.two;
  await fs.rm(path.join(root, 'database', 'library', 'pak04_dir.vpk'));
  assert.equal(await library.getNextAvailablePakFilename(), 'pak03_dir.vpk');
});

test('allocator rejects a full pak02-pak99 range', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-pak-full-'));
  const storage = new JsonStorage(root); await storage.init();
  const library = new VpkLibrary({ rootDir: root, storage }); await library.init();
  for (let number = 2; number <= 99; number += 1) await fs.writeFile(path.join(root, 'database', 'library', `pak${String(number).padStart(2, '0')}_dir.vpk`), 'occupied');
  await assert.rejects(() => library.getNextAvailablePakFilename(), /No free VPK slots available/);
});

test('reorder renames actual pak files and persists the new priority order', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-priority-'));
  const storage = new JsonStorage(root); await storage.init();
  const gameDir = path.join(root, 'game');
  await fs.mkdir(path.join(root, 'database', 'library'), { recursive: true });
  await fs.mkdir(gameDir, { recursive: true });
  const records = {
    first: { id: 'first', modId: 'first', type: 'mod', displayName: 'First', name: 'First', fileName: 'pak02_dir.vpk', gameFileName: 'pak02_dir.vpk', installedFiles: ['pak02_dir.vpk'], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: 2 },
    second: { id: 'second', modId: 'second', type: 'mod', displayName: 'Second', name: 'Second', fileName: 'pak03_dir.vpk', gameFileName: 'pak03_dir.vpk', installedFiles: ['pak03_dir.vpk'], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: 3 },
    third: { id: 'third', modId: 'third', type: 'mod', displayName: 'Third', name: 'Third', fileName: 'pak04_dir.vpk', gameFileName: 'pak04_dir.vpk', installedFiles: ['pak04_dir.vpk'], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: 4 },
  };
  for (const record of Object.values(records)) {
    await fs.writeFile(path.join(root, 'database', 'library', record.fileName), record.displayName);
    await fs.writeFile(path.join(gameDir, record.gameFileName), record.displayName);
  }
  await storage.patch({ installedMods: records });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['third', 'first', 'second']);
  assert.deepEqual(storage.state.installedMods.third.fileName, 'pak02_dir.vpk');
  assert.deepEqual(storage.state.installedMods.first.fileName, 'pak03_dir.vpk');
  assert.deepEqual(storage.state.installedMods.second.fileName, 'pak04_dir.vpk');
  assert.deepEqual(storage.state.installedMods.third.priority, 2);
  assert.deepEqual(storage.state.installedMods.first.priority, 3);
  assert.deepEqual(storage.state.installedMods.second.priority, 4);
  assert.equal(await fs.readFile(path.join(root, 'database', 'library', 'pak02_dir.vpk'), 'utf8'), 'Third');
  assert.equal(await fs.readFile(path.join(root, 'database', 'library', 'pak03_dir.vpk'), 'utf8'), 'First');
  assert.equal(await fs.readFile(path.join(root, 'database', 'library', 'pak04_dir.vpk'), 'utf8'), 'Second');
});

test('reorder preserves each VPK payload when moving C to the top', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-safe-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['c', 'a', 'b']);
  assert.deepEqual(await listVpkFiles(libraryDir), ['pak02_dir.vpk', 'pak03_dir.vpk', 'pak04_dir.vpk']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
  assert.equal(await fileHash(path.join(libraryDir, 'pak02_dir.vpk')), await fileHash(path.join(gameDir, 'pak02_dir.vpk')));
  assert.equal(await fileHash(path.join(libraryDir, 'pak03_dir.vpk')), await fileHash(path.join(gameDir, 'pak03_dir.vpk')));
  assert.equal(await fileHash(path.join(libraryDir, 'pak04_dir.vpk')), await fileHash(path.join(gameDir, 'pak04_dir.vpk')));
  const tempFiles = await fs.readdir(libraryDir).then((entries) => entries.filter((name) => name.includes('vanta_reorder') || name.includes('.tmp')));
  assert.deepEqual(tempFiles, []);
});

test('reorder restores a missing library VPK from the game copy before renaming', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-missing-library-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  await fs.rm(path.join(libraryDir, 'pak03_dir.vpk'));
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['b', 'c', 'a']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
});

test('reorder clears stale library target files before assigning the new order', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-stale-target-'));
  const storage = new JsonStorage(root); await storage.init();
  const libraryDir = path.join(root, 'database', 'library');
  const gameDir = path.join(root, 'game', 'dota');
  await fs.mkdir(libraryDir, { recursive: true });
  await fs.mkdir(gameDir, { recursive: true });
  const records = {
    a: { id: 'a', modId: 'a', type: 'mod', displayName: 'A', name: 'A', fileName: 'pak10_dir.vpk', gameFileName: 'pak10_dir.vpk', installedFiles: ['pak10_dir.vpk'], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: 10 },
    b: { id: 'b', modId: 'b', type: 'mod', displayName: 'B', name: 'B', fileName: 'pak11_dir.vpk', gameFileName: 'pak11_dir.vpk', installedFiles: ['pak11_dir.vpk'], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: 11 },
    c: { id: 'c', modId: 'c', type: 'mod', displayName: 'C', name: 'C', fileName: 'pak12_dir.vpk', gameFileName: 'pak12_dir.vpk', installedFiles: ['pak12_dir.vpk'], languageFolder: 'dota', targetRoot: gameDir, enabled: true, priority: 12 },
  };
  for (const [id, record] of Object.entries(records)) {
    await fs.writeFile(path.join(libraryDir, record.fileName), `MOD_${id.toUpperCase()}_CONTENT`);
    await fs.writeFile(path.join(gameDir, record.fileName), `MOD_${id.toUpperCase()}_CONTENT`);
  }
  await fs.writeFile(path.join(libraryDir, 'pak02_dir.vpk'), 'STALE_LIBRARY_TARGET');
  await fs.writeFile(path.join(gameDir, 'pak02_dir.vpk'), 'STALE_LIBRARY_TARGET');
  await storage.patch({ installedMods: records });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['c', 'a', 'b']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
});

test('reorder preserves payload when moving the first mod to last', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-first-last-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['b', 'c', 'a']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
});

test('reorder preserves payload when moving the last mod to first', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-last-first-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['c', 'a', 'b']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
});

test('reorder preserves payload when swapping adjacent mods', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-adjacent-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['a', 'c', 'b']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
});

test('reorder preserves payload across repeated operations', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-repeated-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['c', 'a', 'b']);
  await manager.reorder(['b', 'c', 'a']);
  await manager.reorder(['a', 'b', 'c']);
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak02_dir.vpk'), 'utf8'), 'MOD_A_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak03_dir.vpk'), 'utf8'), 'MOD_B_CONTENT');
  assert.equal(await fs.readFile(path.join(libraryDir, 'pak04_dir.vpk'), 'utf8'), 'MOD_C_CONTENT');
});

test('reorder keeps VPK count and library state after rescan', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-reorder-rescan-'));
  const { storage, libraryDir, gameDir } = await createLibraryFixture(root, { a: 'MOD_A_CONTENT', b: 'MOD_B_CONTENT', c: 'MOD_C_CONTENT' });
  const manager = new ModManager({ rootDir: root, storage, downloads: {}, getGamePath: () => gameDir, getLanguageFolder: () => 'dota', onProgress: () => {} });
  await manager.reorder(['c', 'a', 'b']);
  const files = await listVpkFiles(libraryDir);
  assert.deepEqual(files, ['pak02_dir.vpk', 'pak03_dir.vpk', 'pak04_dir.vpk']);
  assert.equal(files.length, 3);
  const refreshed = await manager.syncInstalled();
  assert.deepEqual(Object.values(refreshed).map((record) => record.displayName).sort(), ['a', 'b', 'c']);
  assert.deepEqual(Object.values(refreshed).map((record) => record.fileName).sort(), ['pak02_dir.vpk', 'pak03_dir.vpk', 'pak04_dir.vpk']);
});
