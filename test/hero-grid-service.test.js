const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { JsonStorage } = require('../src/infrastructure/storage');
const { HeroGridService, validateGrid } = require('../src/infrastructure/hero-grid-service');

test('bundled D2PT hero grids expose valid and different role data', async () => {
  const storage = new JsonStorage(await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-grids-')));
  await storage.init();
  const service = new HeroGridService({ storage, getGamePath: () => null });
  const result = await service.list();
  assert.deepEqual(result.patches.map((item) => item.patch), ['7.41f']);
  assert.deepEqual(result.patches[0].modes.map((item) => item.id), ['most-played', 'high-winrate']);
  assert.equal(result.patches[0].modes[0].roles.length, 6);
  assert.equal(result.patches[0].modes[0].roles[0].preview[0].heroes.length, 7);
  assert.notDeepEqual(result.patches[0].modes[0].roles[0].preview, result.patches[0].modes[1].roles[0].preview);
  for (const roleId of ['all-roles', 'carry', 'mid', 'offlane', 'support-4', 'support-5']) {
    const mostPlayed = result.patches[0].modes[0].roles.find((role) => role.id === roleId);
    const highWinrate = result.patches[0].modes[1].roles.find((role) => role.id === roleId);
    assert.notDeepEqual(mostPlayed.preview, highWinrate.preview, `${roleId} preview must differ by mode`);
  }
  assert.deepEqual(result.patches[0].modes[0].roles[0].preview.map((item) => item.name), ['Carry', 'Mid', 'Offlane', 'Support', 'Hard Support']);
  assert.equal(result.patches[0].modes[0].roles[1].preview[0].name, 'Carry');
  assert.equal(result.patches[0].modes[0].roles[1].preview[0].heroes[0].key, 'luna');
  assert.equal(result.patches[0].modes[0].roles[1].preview[0].heroes[0].displayName, 'Luna');
});

test('applying a hero grid writes an atomic config, backup, and persistent selection', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-grids-install-'));
  const gamePath = path.join(root, 'steamapps', 'common', 'dota 2 beta', 'game');
  const cfg = path.join(root, 'userdata', '12345', '570', 'remote', 'cfg');
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  await fs.mkdir(cfg, { recursive: true });
  const target = path.join(cfg, 'hero_grid_config.json');
  await fs.writeFile(target, '{"custom":true}');
  const storage = new JsonStorage(root);
  await storage.init();
  const service = new HeroGridService({ storage, getGamePath: () => gamePath });
  const result = await service.apply({ patch: '7.41f', mode: 'high-winrate', role: 'carry' });
  const installed = JSON.parse(await fs.readFile(target, 'utf8'));
  const backups = (await fs.readdir(cfg)).filter((name) => name.includes('.vanta-backup-'));
  assert.equal(result.selection.type, 'high-winrate');
  assert.equal(result.selection.role, 'carry');
  assert.equal(installed.configs[0].config_name, 'Dota2ProTracker 7.41f - Carry');
  assert.equal(installed.configs[0].categories[0].category_name, 'Top Heroes Pos 1');
  assert.equal(backups.length, 1);
  assert.deepEqual(storage.state.settings.heroGridSelection, result.selection);
  assert.equal(installed.version, 3);
});

test('detects the installed hash and restores the original config on disable', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-grids-disable-'));
  const gamePath = path.join(root, 'steamapps', 'common', 'dota 2 beta', 'game');
  const cfg = path.join(root, 'userdata', '12345', '570', 'remote', 'cfg');
  const target = path.join(cfg, 'hero_grid_config.json');
  const original = '{"custom_layout":true}\n';
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  await fs.mkdir(cfg, { recursive: true });
  await fs.writeFile(target, original);
  const storage = new JsonStorage(root);
  await storage.init();
  const service = new HeroGridService({ rootDir: root, storage, getGamePath: () => gamePath });

  await service.apply({ patch: '7.41f', type: 'high-winrate', role: 'mid' });
  const installed = await service.list();
  assert.equal(installed.installation.installed, true);
  assert.equal(installed.patches[0].modes[1].roles.find((role) => role.id === 'mid').installed, true);

  await service.disable();
  assert.equal(await fs.readFile(target, 'utf8'), original);
  assert.equal((await service.list()).installation.installed, false);
  assert.equal((await service.list()).patches.flatMap((patch) => patch.modes.flatMap((mode) => mode.roles)).some((role) => role.installed), false);
});

test('deleting a grid without an original config removes only the installed file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-grids-delete-'));
  const gamePath = path.join(root, 'steamapps', 'common', 'dota 2 beta', 'game');
  const cfg = path.join(root, 'userdata', '12345', '570', 'remote', 'cfg');
  const target = path.join(cfg, 'hero_grid_config.json');
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  await fs.mkdir(cfg, { recursive: true });
  const storage = new JsonStorage(root);
  await storage.init();
  const service = new HeroGridService({ rootDir: root, storage, getGamePath: () => gamePath });

  await service.apply({ patch: '7.41f', type: 'most-played', role: 'carry' });
  assert.equal((await fs.stat(target)).isFile(), true);
  await service.disable();
  await assert.rejects(fs.stat(target), { code: 'ENOENT' });
  assert.equal((await fs.readdir(cfg)).some((name) => name.includes('.vanta-backup-')), false);
});

test('marks only the installed full-config mode and removes custom layouts', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-grids-user-layouts-'));
  const gamePath = path.join(root, 'steamapps', 'common', 'dota 2 beta', 'game');
  const cfg = path.join(root, 'userdata', '12345', '570', 'remote', 'cfg');
  const target = path.join(cfg, 'hero_grid_config.json');
  const source = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'src/data/hero-grids/7.41f/high-winrate.json'), 'utf8'));
  source.configs.push({ config_name: 'My Custom Layout', categories: [{ category_name: 'Custom', x_position: 0, y_position: 0, width: 100, height: 100, hero_ids: [1] }] });
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  await fs.mkdir(cfg, { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(source)}\n`);
  const storage = new JsonStorage(root);
  await storage.init();
  const service = new HeroGridService({ rootDir: root, storage, getGamePath: () => gamePath });

  await service.apply({ patch: '7.41f', type: 'high-winrate', role: 'mid' });
  const installed = await service.list();
  assert.equal(installed.patches[0].modes[0].roles[0].installed, false);
  assert.equal(installed.patches[0].modes[1].roles.find((role) => role.id === 'mid').installed, true);
  for (const role of installed.patches[0].modes[1].roles) {
    if (role.id !== 'mid') assert.equal(role.installed, false, `${role.id} must not be marked installed`);
  }

  const userBefore = await service.userGrids();
  assert.equal(userBefore.grids.some((grid) => grid.name === 'My Custom Layout'), true);
  await fs.writeFile(target, `${JSON.stringify(source)}\n`);
  const removed = await service.removeUserGrids();
  assert.equal(removed.removed, 1);
  const after = JSON.parse(await fs.readFile(target, 'utf8'));
  assert.equal(after.configs.some((config) => config.config_name === 'My Custom Layout'), false);
  assert.equal(after.configs.some((config) => /^Dota2ProTracker/.test(config.config_name)), true);
});

test('deletes one user layout without deleting the installed D2PT layout', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-grids-user-delete-'));
  const gamePath = path.join(root, 'steamapps', 'common', 'dota 2 beta', 'game');
  const cfg = path.join(root, 'userdata', '12345', '570', 'remote', 'cfg');
  const target = path.join(cfg, 'hero_grid_config.json');
  const storage = new JsonStorage(root);
  await fs.mkdir(path.join(gamePath, 'dota'), { recursive: true });
  await fs.mkdir(cfg, { recursive: true });
  await storage.init();
  const service = new HeroGridService({ rootDir: root, storage, getGamePath: () => gamePath });
  const source = JSON.parse(await fs.readFile(path.join(__dirname, '..', 'src/data/hero-grids/7.41f/most-played.json'), 'utf8'));
  source.configs.push({ config_name: 'Keep Me', categories: [{ category_name: 'Custom', x_position: 0, y_position: 0, width: 100, height: 100, hero_ids: [1] }] });
  source.configs.push({ config_name: 'Delete Me', categories: [{ category_name: 'Custom', x_position: 0, y_position: 0, width: 100, height: 100, hero_ids: [2] }] });
  await fs.writeFile(target, `${JSON.stringify(source)}\n`);

  await service.apply({ patch: '7.41f', type: 'most-played', role: 'carry' });
  const userGrid = (await service.userGrids()).grids.find((grid) => grid.name === 'Delete Me');
  await service.removeUserGrid(userGrid.index);
  const result = JSON.parse(await fs.readFile(target, 'utf8'));
  assert.equal(result.configs.some((config) => config.config_name === 'Delete Me'), false);
  assert.equal(result.configs.some((config) => config.config_name === 'Keep Me'), true);
  assert.equal(result.configs[0].config_name, 'Dota2ProTracker 7.41f - Carry');
});