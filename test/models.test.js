const test = require('node:test');
const assert = require('node:assert/strict');
const { flattenCatalog, searchMods } = require('../src/core/models');

test('flattens the external catalog and normalizes ids', () => {
  const mods = flattenCatalog({ mods: { modsData: { heroes: [{ name: 'Invoker Arcana', file: 'x.zip', categoryId: 'heroes' }] } } });
  assert.equal(mods[0].id, 'invoker-arcana');
  assert.equal(mods[0].downloadUrl, 'x.zip');
});

test('search filters by query and category without mutating input', () => {
  const mods = flattenCatalog({ mods: { modsData: { heroes: [{ name: 'Invoker Arcana', categoryId: 'heroes' }], terrain: [{ name: 'Autumn Terrain', categoryId: 'terrain' }] } } });
  assert.equal(searchMods(mods, 'invoker', { category: 'heroes' }).length, 1);
  assert.equal(searchMods(mods, '', { category: 'terrain' })[0].name, 'Autumn Terrain');
  assert.equal(mods.length, 2);
});

test('hero browsing can narrow the catalog to one hero', () => {
  const mods = flattenCatalog({ mods: { modsData: { heroes: [{ name: 'Invoker Set', hero: 'invoker' }, { name: 'Pudge Set', hero: 'pudge' }] } } });
  assert.deepEqual(searchMods(mods, '', { hero: 'invoker' }).map((mod) => mod.name), ['Invoker Set']);
});

test('normalizes hero aliases with spaces and dashes to canonical ids', () => {
  const mods = flattenCatalog({ mods: { modsData: { heroes: [{ name: 'Anti-Mage Set', hero: 'Anti-Mage' }, { name: 'Nature Prophet Set', hero: 'Nature Prophet' }, { name: 'Furion Set', hero: 'furion' }, { name: 'Obsidian Destroyer Set', hero: 'obsidian_destroyer' }, { name: 'Shadow Fiend Set', hero: 'Shadow-Fiend' }, { name: 'Windrunner Set', hero: 'windrunner' }, { name: 'Abyssal Underlord Set', hero: 'abyssal underlord' }, { name: 'Rattletrap Set', hero: 'rattletrap' }] } } });
  assert.deepEqual(searchMods(mods, '', { hero: 'anti_mage' }).map((mod) => mod.name), ['Anti-Mage Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'nature_prophet' }).map((mod) => mod.name), ['Nature Prophet Set', 'Furion Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'furion' }).map((mod) => mod.name), ['Nature Prophet Set', 'Furion Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'outworld_devourer' }).map((mod) => mod.name), ['Obsidian Destroyer Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'shadow_fiend' }).map((mod) => mod.name), ['Shadow Fiend Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'windranger' }).map((mod) => mod.name), ['Windrunner Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'underlord' }).map((mod) => mod.name), ['Abyssal Underlord Set']);
  assert.deepEqual(searchMods(mods, '', { hero: 'clockwerk' }).map((mod) => mod.name), ['Rattletrap Set']);
});