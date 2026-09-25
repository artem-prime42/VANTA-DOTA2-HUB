const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');

const root = path.join(__dirname, '..');

test('app version is set to 2.0.3 and displayed in settings', async () => {
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.version, '2.0.3');

  const settingsMarkup = await fs.readFile(path.join(root, 'renderer', 'settings-page.js'), 'utf8');
  assert.match(settingsMarkup, /Version|Версия/);
  assert.match(settingsMarkup, /state\.data\.appVersion/);
});
