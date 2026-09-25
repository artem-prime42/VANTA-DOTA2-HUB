const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { detectExternalFiles } = require('../src/infrastructure/external-files');

test('external file analyzer identifies hero and preview without claiming ownership', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-external-'));
  const language = path.join(game, 'dota_english');
  await fs.mkdir(language, { recursive: true });
  await fs.writeFile(path.join(language, 'pak_pudge_custom.vpk'), 'external');
  const files = await detectExternalFiles(game, [{ hero: 'pudge', heroLabel: 'Pudge', previewUrl: 'preview.webp' }], 'dota_english');
  assert.equal(files.length, 1);
  assert.equal(files[0].hero, 'pudge');
  assert.equal(files[0].previewUrl, 'preview.webp');
});

test('external analyzer keeps disabled files discoverable', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-external-disabled-'));
  const language = path.join(game, 'dota_english');
  await fs.mkdir(language, { recursive: true });
  await fs.writeFile(path.join(language, 'pak_pudge_custom.vpk.vanta-disabled'), 'external');
  const files = await detectExternalFiles(game, [], 'dota_english');
  assert.equal(files[0].enabled, false);
  assert.equal(files[0].relativePath, 'dota_english/pak_pudge_custom.vpk');
});

test('external analyzer keeps old launcher .off files discoverable', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-legacy-off-'));
  const language = path.join(game, 'dota_english');
  await fs.mkdir(language, { recursive: true });
  await fs.writeFile(path.join(language, 'pak42_dir.vpk.off'), 'legacy');
  const files = await detectExternalFiles(game, [], 'dota_english');
  assert.equal(files[0].enabled, false);
  assert.equal(files[0].relativePath, 'dota_english/pak42_dir.vpk');
});

test('external analyzer excludes files owned by VANTA manifests', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-owned-'));
  const language = path.join(game, 'dota_english');
  await fs.mkdir(language, { recursive: true });
  const owned = path.join(language, 'owned.vpk');
  const external = path.join(language, 'manual_pudge.vpk');
  await fs.writeFile(owned, 'owned');
  await fs.writeFile(external, 'external');
  const files = await detectExternalFiles(game, [], 'dota_english', [owned]);
  assert.deepEqual(files.map((file) => file.fileName), ['manual_pudge.vpk']);
});

test('external analyzer excludes files recorded by the old launcher manifest', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-legacy-'));
  const language = path.join(game, 'dota_english');
  await fs.mkdir(language, { recursive: true });
  const legacy = path.join(language, 'pak42_dir.vpk');
  const external = path.join(language, 'manual.vpk');
  await fs.writeFile(legacy, 'legacy');
  await fs.writeFile(external, 'external');
  const files = await detectExternalFiles(game, [], 'dota_english', [], [legacy]);
  assert.deepEqual(files.map((file) => file.fileName), ['manual.vpk']);
});

test('external analyzer discovers files only from the selected base dota folder', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-external-base-'));
  const dota = path.join(game, 'dota');
  await fs.mkdir(dota, { recursive: true });
  await fs.writeFile(path.join(dota, 'manual_invoker.vpk'), 'external');
  const files = await detectExternalFiles(game, [], 'dota');
  assert.equal(files.length, 1);
  assert.equal(files[0].relativePath, 'dota/manual_invoker.vpk');
  assert.equal(files[0].hero, 'invoker');
});

test('external analyzer excludes other language folders and nested dota content', async () => {
  const game = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-external-language-scope-'));
  await fs.mkdir(path.join(game, 'dota_english', 'maps'), { recursive: true });
  await fs.mkdir(path.join(game, 'dota_russian'), { recursive: true });
  await fs.mkdir(path.join(game, 'dota'), { recursive: true });
  await fs.writeFile(path.join(game, 'dota_english', 'english_mod.vpk'), 'external');
  await fs.writeFile(path.join(game, 'dota_english', 'maps', 'nested.vpk'), 'nested');
  await fs.writeFile(path.join(game, 'dota_russian', 'russian_mod.vpk'), 'other language');
  await fs.writeFile(path.join(game, 'dota', 'base_mod.vpk'), 'base');
  const files = await detectExternalFiles(game, [], 'dota_english');
  assert.deepEqual(files.map((file) => file.relativePath), ['dota_english/english_mod.vpk']);
});