const test = require('node:test');
const assert = require('node:assert/strict');
const { detectDotaInstallation } = require('../src/infrastructure/steam-detector');
const { VpkReader } = require('vpk-tools');

test('real Dota 2 installation is detected and exposes real VPK resources', async () => {
  const result = await detectDotaInstallation();
  if (!result.detected) {
    console.warn('Dota 2 installation not detected in this environment; skipping real-resource validation.');
    return;
  }

  assert.ok(result.dotaPath, 'Expected a real Dota game path to be resolved.');
  assert.ok(result.pak01Path, 'Expected a real pak01_dir.vpk to be resolved.');
  const reader = VpkReader.open(result.pak01Path);
  try {
    const files = reader.files();
    assert.ok(files.some((file) => /scripts\/npc\/heroes\/npc_dota_hero_invoker\.txt$/i.test(file)), 'Expected the actual Invoker hero definition from pak01.');
    assert.ok(files.some((file) => /models\/heroes\/invoker\//i.test(file) || /models\/heroes\/invoker\.[^/]+\.vmdl.*$/i.test(file)), 'Expected real Invoker hero model files in the VPK.');
    assert.ok(files.some((file) => /models\/items\/invoker\//i.test(file)), 'Expected real Invoker cosmetic item model files in the VPK.');
  } finally {
    reader.close();
  }
});
