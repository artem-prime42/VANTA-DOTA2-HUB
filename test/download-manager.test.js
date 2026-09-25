const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { DownloadManager } = require('../src/infrastructure/download-manager');

test('download manager reuses and clears saved archives', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-downloads-'));
  const manager = new DownloadManager(root);
  const destination = path.join(root, 'downloads', 'mod.zip');
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, 'cached');
  let requests = 0;
  assert.equal(await manager.download('mod', 'https://example.test/mod.zip'), destination);
  assert.equal(requests, 0);
  await fs.writeFile(`${destination}.url`, 'https://example.test/old.zip');
  await assert.rejects(manager.download('mod', 'https://example.test/new.zip'));
  await fs.writeFile(path.join(root, 'downloads', 'broken.part'), 'partial');
  await fs.writeFile(path.join(root, 'downloads', 'legacy.ZIP'), 'legacy');
  await fs.mkdir(path.join(root, 'downloads', 'stale'), { recursive: true });
  await fs.writeFile(path.join(root, 'downloads', 'stale', 'archive.bin'), 'stale');
  await manager.clear();
  await assert.rejects(fs.access(destination));
  await assert.rejects(fs.access(path.join(root, 'downloads', 'broken.part')));
  await assert.rejects(fs.access(path.join(root, 'downloads', 'legacy.ZIP')));
  await assert.rejects(fs.access(path.join(root, 'downloads', 'stale')));
});

test('download manager clears archives from legacy roots', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-downloads-'));
  const legacyRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-legacy-'));
  const secondLegacyRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vanta-legacy-'));
  const manager = new DownloadManager(root, undefined, [legacyRoot, secondLegacyRoot]);
  await fs.mkdir(path.join(legacyRoot, 'downloads'), { recursive: true });
  await fs.writeFile(path.join(legacyRoot, 'downloads', 'legacy.zip'), 'cached');
  await fs.mkdir(path.join(secondLegacyRoot, 'downloads'), { recursive: true });
  await fs.writeFile(path.join(secondLegacyRoot, 'downloads', 'second-legacy.zip'), 'cached');
  const stats = await manager.getStats();
  assert.deepEqual({ count: stats.count, bytes: stats.bytes }, { count: 2, bytes: 12 });
  assert.deepEqual(stats.directories, [path.join(root, 'downloads')]);
  await manager.clear();
  await assert.rejects(fs.access(path.join(legacyRoot, 'downloads', 'legacy.zip')));
  await assert.rejects(fs.access(path.join(secondLegacyRoot, 'downloads', 'second-legacy.zip')));
  const clearedStats = await manager.getStats();
  assert.deepEqual({ count: clearedStats.count, bytes: clearedStats.bytes }, { count: 0, bytes: 0 });
});