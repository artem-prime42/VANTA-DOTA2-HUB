const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { JsonStorage, safeRename } = require('../src/infrastructure/storage');

test('local state survives a new storage instance', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-'));
  const first = new JsonStorage(root);
  await first.init();
  await first.patch({ favorites: ['mod-one'] });
  const second = new JsonStorage(root);
  await second.init();
  assert.deepEqual(second.state.favorites, ['mod-one']);
});

test('same-path rename is ignored instead of throwing', async () => {
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-same-path-')), 'state.json');
  await fs.writeFile(file, 'ok');
  await safeRename(file, file);
  assert.equal(await fs.readFile(file, 'utf8'), 'ok');
});