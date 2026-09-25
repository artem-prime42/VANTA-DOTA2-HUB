const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const AdmZip = require('adm-zip');
const { VpkReader, VpkWriter } = require('vpk-tools');
const { JsonStorage } = require('../src/infrastructure/storage');
const { ModManager } = require('../src/application/mod-manager');
const { AppService } = require('../src/main/services/app-service');

test('uninstall removes only files recorded in the VANTA manifest', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-mod-'));
  const gamePath = path.join(root, 'game');
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  const archive = path.join(root, 'mod.zip');
  const zip = new AdmZip();
  const sourceVpk = path.join(root, 'source_dir.vpk');
  const sourceWriter = new VpkWriter(); sourceWriter.addFile('scripts/owned.txt', Buffer.from('owned')); sourceWriter.write(sourceVpk);
  zip.addLocalFile(sourceVpk, '', 'pak01_dir.vpk');
  zip.writeZip(archive);
  const storage = new JsonStorage(root);
  await storage.init();
  const manager = new ModManager({ rootDir: root, storage, getGamePath: () => gamePath, downloads: { download: async () => archive } });
  await manager.install({ id: 'test-mod', version: '1', downloadUrl: 'file://archive' });
  await fs.writeFile(path.join(gamePath, 'dota', 'original.txt'), 'keep');
  await manager.uninstall('test-mod');
  await assert.rejects(fs.access(path.join(gamePath, 'dota', 'pak01_dir.vpk')));
  assert.equal(await fs.readFile(path.join(gamePath, 'dota', 'original.txt'), 'utf8'), 'keep');
});

test('library keeps mods from the shared dota folder visible for every language', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-library-language-'));
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.storage.patch({
    settings: { ...service.storage.state.settings, langSuffix: 'russian' },
    installedMods: {
      shared: { id: 'shared', modId: 'shared', type: 'mod', displayName: 'Shared mod', languageFolder: 'dota', installedFiles: [] },
    },
  });

  const library = await service.getLibrary();

  assert.equal(library.installed.some((mod) => mod.id === 'shared'), true);
});

test('changing language moves installed mods to the selected language folder', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-language-move-'));
  const gamePath = path.join(root, 'game');
  const oldRoot = path.join(gamePath, 'dota_english');
  await fs.mkdir(oldRoot, { recursive: true });
  const source = path.join(oldRoot, 'pak02_dir.vpk');
  await fs.writeFile(source, 'mod');
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  service.gamePath = gamePath;
  await service.storage.patch({
    settings: { ...service.storage.state.settings, langSuffix: 'english' },
    installedMods: {
      mod: { id: 'mod', modId: 'mod', type: 'mod', fileName: 'pak02_dir.vpk', gameFileName: 'pak02_dir.vpk', languageFolder: 'english', targetRoot: oldRoot, installedFiles: ['pak02_dir.vpk'], enabled: true },
    },
  });

  await service.setSetting('langSuffix', 'russian');

  await assert.rejects(fs.access(source));
  assert.equal(await fs.readFile(path.join(gamePath, 'dota_russian', 'pak02_dir.vpk'), 'utf8'), 'mod');
  assert.equal(service.storage.state.installedMods.mod.languageFolder, 'russian');
});

test('enable and disable only rename files owned by the manifest', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-toggle-'));
  const gamePath = path.join(root, 'game');
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  const archive = path.join(root, 'mod.zip');
  const zip = new AdmZip();
  const sourceVpk = path.join(root, 'source_dir.vpk');
  const sourceWriter = new VpkWriter(); sourceWriter.addFile('scripts/owned.txt', Buffer.from('owned')); sourceWriter.write(sourceVpk);
  zip.addLocalFile(sourceVpk, '', 'owned.vpk');
  zip.writeZip(archive);
  const storage = new JsonStorage(root);
  await storage.init();
  const manager = new ModManager({ rootDir: root, storage, getGamePath: () => gamePath, downloads: { download: async () => archive } });
  await manager.install({ id: 'toggle-mod', name: 'Toggle Mod', categoryId: 'heroes', version: '1', downloadUrl: 'file://archive' });
  const fileName = storage.state.installedMods['toggle-mod'].fileName;
  await manager.setEnabled('toggle-mod', false);
  await assert.rejects(fs.access(path.join(gamePath, 'dota', fileName)));
  await fs.access(path.join(gamePath, 'dota', `${fileName}.vanta-disabled`));
  await manager.setEnabled('toggle-mod', true);
  await fs.access(path.join(gamePath, 'dota', fileName));
});

test('merge creates one pack VPK and removes source Library items', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-merge-'));
  const gamePath = path.join(root, 'game');
  const targetRoot = path.join(gamePath, 'dota_english');
  await fs.mkdir(targetRoot, { recursive: true });
  const first = path.join(targetRoot, 'first_dir.vpk');
  const second = path.join(targetRoot, 'second_dir.vpk');
  const firstWriter = new VpkWriter(); firstWriter.addFile('scripts/first.txt', Buffer.from('first')); firstWriter.write(first);
  const secondWriter = new VpkWriter(); secondWriter.addFile('scripts/second.txt', Buffer.from('second')); secondWriter.addFile('scripts/first.txt', Buffer.from('override')); secondWriter.write(second);
  const storage = new JsonStorage(root); await storage.init();
  await storage.patch({ installedMods: {
    one: { modId: 'one', name: 'One', languageFolder: 'dota_english', targetRoot, installedFiles: ['first_dir.vpk'] },
    two: { modId: 'two', name: 'Two', languageFolder: 'dota_english', targetRoot, installedFiles: ['second_dir.vpk'] },
  } });
  const manager = new ModManager({ rootDir: root, storage, getGamePath: () => gamePath, downloads: { download: async () => '' } });
  const pack = await manager.merge(['one', 'two'], 'Combined');
  assert.equal(pack.name, 'Combined');
  assert.equal(storage.state.installedMods.one, undefined);
  assert.equal(storage.state.installedMods.two, undefined);
  assert.equal(Object.values(storage.state.installedMods).filter((record) => record.type === 'pack').length, 1);
  assert.deepEqual(pack.sourceMods.map((source) => source.name), ['One', 'Two']);
  const libraryPath = path.join(root, 'database', 'library', pack.fileName);
  await fs.access(libraryPath);
  assert.deepEqual((await fs.readdir(path.join(root, 'database', 'library'))).filter((file) => file.endsWith('.vpk')), [pack.fileName]);
  const mergedReader = VpkReader.open(libraryPath);
  try { assert.equal(mergedReader.readFile('scripts/first.txt').toString(), 'override'); } finally { mergedReader.close(); }
  await manager.setEnabled(pack.modId, true);
  await fs.access(path.join(targetRoot, pack.fileName));
  await manager.setEnabled(pack.modId, false);
  await fs.access(path.join(targetRoot, `${pack.fileName}.vanta-disabled`));
  await manager.renamePack(pack.modId, 'Renamed pack');
  assert.equal(storage.state.installedMods[pack.modId].name, 'Renamed pack');
});

test('merge can combine an existing pack with another mod and flattens pack contents', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-merge-pack-'));
  const gamePath = path.join(root, 'game');
  const targetRoot = path.join(gamePath, 'dota_english');
  await fs.mkdir(targetRoot, { recursive: true });
  const oldPackPath = path.join(root, 'old-pack.vpk');
  const modPath = path.join(root, 'mod.vpk');
  const oldPackWriter = new VpkWriter(); oldPackWriter.addFile('scripts/from-pack.txt', Buffer.from('pack')); oldPackWriter.write(oldPackPath);
  const modWriter = new VpkWriter(); modWriter.addFile('scripts/from-mod.txt', Buffer.from('mod')); modWriter.write(modPath);
  const storage = new JsonStorage(root); await storage.init();
  const manager = new ModManager({ rootDir: root, storage, getGamePath: () => gamePath, downloads: { download: async () => '' } });
  await manager.library.init();
  await fs.copyFile(oldPackPath, path.join(manager.library.directory, 'old-pack_dir.vpk'));
  await fs.copyFile(modPath, path.join(manager.library.directory, 'mod_dir.vpk'));
  await storage.patch({ installedMods: {
    'old-pack': { id: 'old-pack', modId: 'old-pack', type: 'pack', name: 'Old pack', displayName: 'Old pack', fileName: 'old-pack_dir.vpk', installedFiles: ['old-pack_dir.vpk'], targetRoot, languageFolder: 'dota_english', enabled: true, sourceMods: [{ id: 'inside', name: 'Inside pack' }] },
    standalone: { id: 'standalone', modId: 'standalone', type: 'mod', name: 'Standalone', displayName: 'Standalone', fileName: 'mod_dir.vpk', installedFiles: ['mod_dir.vpk'], targetRoot, languageFolder: 'dota_english', enabled: true },
  } });
  const pack = await manager.merge(['old-pack', 'standalone'], 'Combined pack');
  assert.deepEqual(pack.sourceMods.map((source) => source.name), ['Inside pack', 'Standalone']);
  assert.equal(storage.state.installedMods['old-pack'], undefined);
  assert.equal(storage.state.installedMods.standalone, undefined);
  const mergedReader = VpkReader.open(path.join(manager.library.directory, pack.fileName));
  try {
    assert.equal(mergedReader.readFile('scripts/from-pack.txt').toString(), 'pack');
    assert.equal(mergedReader.readFile('scripts/from-mod.txt').toString(), 'mod');
  } finally { mergedReader.close(); }
});

test('saveSavedPack creates a saved pack archive from a library pack', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-saved-pack-'));
  const storage = new JsonStorage(root);
  await storage.init();
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.mods.library.init();
  const savedModPath = path.join(service.mods.library.directory, 'saved_mod_dir.vpk');
  const writer = new VpkWriter(); writer.addFile('scripts/keep.txt', Buffer.from('keep')); writer.write(savedModPath);
  await service.storage.patch({ installedMods: {
    saved_mod: { id: 'saved_mod', modId: 'saved_mod', type: 'mod', name: 'Saved mod', displayName: 'Saved mod', fileName: 'saved_mod_dir.vpk', installedFiles: ['saved_mod_dir.vpk'], targetRoot: path.join(root, 'game', 'dota'), languageFolder: 'dota', enabled: true },
  } });
  const result = await service.saveSavedPack({ name: 'Preset', modIds: ['saved_mod'] });
  assert.equal(result.savedPacks[0].name, 'Preset');
  assert.equal(result.savedPacks[0].modIds[0], 'saved_mod');
  const packFile = path.join(service.savedPacks.directory, result.savedPacks[0].id, 'pack.vpk');
  await fs.access(packFile);
  const reader = VpkReader.open(packFile);
  try { assert.equal(reader.readFile('scripts/keep.txt').toString(), 'keep'); } finally { reader.close(); }
});

test('saveSavedPack copies an existing library pack without selected mods', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-saved-existing-pack-'));
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.mods.library.init();
  const sourceFileName = 'existing-pack_dir.vpk';
  const sourcePath = path.join(service.mods.library.directory, sourceFileName);
  const writer = new VpkWriter(); writer.addFile('scripts/existing.txt', Buffer.from('existing')); writer.write(sourcePath);
  await service.storage.patch({ installedMods: {
    pack_a: { id: 'pack_a', modId: 'pack_a', type: 'pack', name: 'Pack A', displayName: 'Pack A', fileName: sourceFileName, installedFiles: [sourceFileName], sourceModIds: ['missing-source'], sourceMods: [{ id: 'missing-source', name: 'Missing source' }], enabled: true },
  } });

  const result = await service.saveSavedPack({ name: 'Saved Pack A', packId: 'pack_a', modIds: [] });
  const saved = result.savedPacks[0];
  assert.equal(saved.sourcePackId, 'pack_a');
  assert.equal(saved.sourceFileName, sourceFileName);
  const savedPath = path.join(service.savedPacks.directory, saved.id, 'pack.vpk');
  assert.notEqual(savedPath, sourcePath);
  assert.equal((await fs.stat(savedPath)).size, (await fs.stat(sourcePath)).size);
  assert.equal((await fs.readFile(savedPath)).equals(await fs.readFile(sourcePath)), true);
  await fs.access(sourcePath);
  const restarted = new AppService({ rootDir: root });
  const afterRestart = await restarted.listSavedPacks();
  assert.equal(afterRestart.savedPacks[0].name, 'Saved Pack A');
  restarted.gamePath = path.join(root, 'game');
  await fs.mkdir(path.join(restarted.gamePath, 'dota_dota'), { recursive: true });
  const activated = await restarted.activateSavedPack(saved.id);
  assert.equal(activated.savedPacks[0].installedFileName, 'pak02_dir.vpk');
  await fs.access(path.join(restarted.gamePath, 'dota_dota', 'pak02_dir.vpk'));
});

test('saveSavedPack copies the requested pack even when selected mods point elsewhere', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-saved-specific-pack-'));
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.mods.library.init();
  const files = {};
  for (const [id, content] of [['pack_a', 'A'], ['pack_b', 'B']]) {
    files[id] = `${id}_dir.vpk`;
    const writer = new VpkWriter(); writer.addFile('scripts/value.txt', Buffer.from(content)); writer.write(path.join(service.mods.library.directory, files[id]));
  }
  await service.storage.patch({ installedMods: {
    pack_a: { id: 'pack_a', type: 'pack', name: 'Pack A', fileName: files.pack_a, sourceModIds: [] },
    pack_b: { id: 'pack_b', type: 'pack', name: 'Pack B', fileName: files.pack_b, sourceModIds: [] },
  } });

  const result = await service.saveSavedPack({ name: 'Only A', packId: 'pack_a', modIds: ['pack_b'] });
  const savedPath = path.join(service.savedPacks.directory, result.savedPacks[0].id, 'pack.vpk');
  const reader = VpkReader.open(savedPath);
  try { assert.equal(reader.readFile('scripts/value.txt').toString(), 'A'); } finally { reader.close(); }
});

test('saved pack activation links filesystem Library records and avoids duplicate VPK copies', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-saved-pack-link-'));
  const gamePath = path.join(root, 'game');
  const targetRoot = path.join(gamePath, 'dota_english');
  await fs.mkdir(targetRoot, { recursive: true });
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.mods.library.init();
  await service.storage.patch({ settings: { ...service.storage.state.settings, langSuffix: 'english', gamePath } });
  service.gamePath = gamePath;
  const sourceFileName = 'library-pack_dir.vpk';
  const sourcePath = path.join(service.mods.library.directory, sourceFileName);
  const writer = new VpkWriter(); writer.addFile('scripts/link.txt', Buffer.from('linked')); writer.addFile('materials/test.vmat', Buffer.from('material')); writer.write(sourcePath);
  await service.storage.patch({ installedMods: { library_pack: { id: 'library_pack', modId: 'library_pack', type: 'pack', displayName: 'Library Pack', name: 'Library Pack', fileName: sourceFileName, installedFiles: [sourceFileName], sourceMods: [{ id: 'member', name: 'Member' }], targetRoot, languageFolder: 'english', enabled: true } } });

  const savedResult = await service.saveSavedPack({ name: 'Linked Pack', packId: 'library_pack', modIds: [] });
  const savedId = savedResult.savedPacks[0].id;
  const duplicateResult = await service.saveSavedPack({ name: 'Linked Pack Copy', packId: 'library_pack', modIds: [] });
  assert.equal(duplicateResult.savedPacks.length, 1);
  assert.equal(duplicateResult.savedPacks[0].id, savedId);
  const savedContents = await service.getSavedPackContents(savedId);
  assert.deepEqual(savedContents.files.sort(), ['materials/test.vmat', 'scripts/link.txt']);
  assert.equal(savedContents.source, 'saved');

  const before = (await fs.readdir(targetRoot)).filter((file) => /^pak\d{2}_dir\.vpk$/i.test(file));
  const activated = await service.activateSavedPack(savedId);
  const afterFirst = (await fs.readdir(targetRoot)).filter((file) => /^pak\d{2}_dir\.vpk$/i.test(file));
  assert.equal(before.length, 0);
  assert.equal(afterFirst.length, 1);
  assert.equal(activated.savedPacks[0].active, true);
  const library = await service.getLibrary();
  const activePack = Object.values(library.installed).find((record) => record.savedPackId === savedId);
  assert.equal(activePack.type, 'pack');
  const libraryContents = await service.getLibraryPackContents(activePack.id);
  assert.equal(libraryContents.source, 'library');
  assert.deepEqual(libraryContents.files.sort(), savedContents.files.sort());

  await service.activateSavedPack(savedId);
  const afterSecond = (await fs.readdir(targetRoot)).filter((file) => /^pak\d{2}_dir\.vpk$/i.test(file));
  assert.equal(afterSecond.length, 1);
  const restarted = new AppService({ rootDir: root });
  await restarted.init();
  restarted.gamePath = gamePath;
  assert.equal((await restarted.listSavedPacks()).savedPacks[0].active, true);

  await fs.rm(path.join(targetRoot, afterSecond[0]));
  await restarted.getLibrary();
  assert.equal((await restarted.listSavedPacks()).savedPacks[0].active, false);
  assert.equal(Object.values(restarted.storage.state.installedMods).some((record) => record.savedPackId === savedId), false);

  await restarted.activateSavedPack(savedId);
  const restored = (await fs.readdir(targetRoot)).filter((file) => /^pak\d{2}_dir\.vpk$/i.test(file));
  assert.equal(restored.length, 1);
  await restarted.deleteSavedPack(savedId);
  assert.equal((await fs.readdir(targetRoot)).filter((file) => /^pak\d{2}_dir\.vpk$/i.test(file)).length, 1);
});

test('saved pack ignores stale library ids and still saves valid entries', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-saved-pack-stale-ids-'));
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.mods.library.init();
  const savedModPath = path.join(service.mods.library.directory, 'saved_mod_dir.vpk');
  const writer = new VpkWriter(); writer.addFile('scripts/keep.txt', Buffer.from('keep')); writer.write(savedModPath);
  await service.storage.patch({ installedMods: {
    saved_mod: { id: 'saved_mod', modId: 'saved_mod', type: 'mod', name: 'Saved mod', displayName: 'Saved mod', fileName: 'saved_mod_dir.vpk', installedFiles: ['saved_mod_dir.vpk'], targetRoot: path.join(root, 'game', 'dota'), languageFolder: 'dota', enabled: true },
  } });

  const result = await service.saveSavedPack({ name: 'Valid only', modIds: ['missing_mod', 'saved_mod'] });
  assert.equal(result.savedPacks[0].name, 'Valid only');
  assert.deepEqual(result.savedPacks[0].modIds, ['saved_mod']);
});

test('saved pack names are unique and delete/rename operate on the stored record', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-saved-pack-validation-'));
  const service = new AppService({ rootDir: root });
  await service.storage.init();
  await service.mods.library.init();
  const savedModPath = path.join(service.mods.library.directory, 'saved_mod_dir.vpk');
  const writer = new VpkWriter(); writer.addFile('scripts/keep.txt', Buffer.from('keep')); writer.write(savedModPath);
  await service.storage.patch({ installedMods: {
    saved_mod: { id: 'saved_mod', modId: 'saved_mod', type: 'mod', name: 'Saved mod', displayName: 'Saved mod', fileName: 'saved_mod_dir.vpk', installedFiles: ['saved_mod_dir.vpk'], targetRoot: path.join(root, 'game', 'dota'), languageFolder: 'dota', enabled: true },
  } });

  await service.saveSavedPack({ name: 'Duplicate', modIds: ['saved_mod'] });
  await assert.rejects(() => service.saveSavedPack({ name: 'Duplicate', modIds: ['saved_mod'] }), /already exists|duplicate/i);

  const firstPack = (await service.getSavedPacks())[0];
  const renamed = await service.renameSavedPack(firstPack.id, 'Renamed pack');
  assert.equal(renamed.savedPacks[0].name, 'Renamed pack');
  const afterDelete = await service.deleteSavedPack(firstPack.id);
  assert.equal(afterDelete.savedPacks.length, 0);
});