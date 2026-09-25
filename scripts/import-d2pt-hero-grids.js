const fs = require('fs');
const path = require('path');

function readToolResult(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^Result: /, '');
  return JSON.parse(JSON.parse(raw));
}

function readPreview(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/^Result: /, '');
  return JSON.parse(raw);
}

function buildGrid(base, preview) {
  const result = structuredClone(base);
  const allHeroes = result.configs[0].categories.find((category) => category.category_name === 'All Heroes');
  const previewAll = preview.find((category) => category.name === 'All Heroes');
  const heroIds = new Map(previewAll.heroes.map((hero, index) => [hero.name, allHeroes.hero_ids[index]]));
  for (const category of result.configs[0].categories) {
    const source = preview.find((item) => item.name === category.category_name);
    if (!source) continue;
    const ids = source.heroes.map((hero) => heroIds.get(hero.name)).filter(Number.isInteger);
    if (ids.length !== source.heroes.length) throw new Error(`Unknown hero in ${category.category_name}`);
    category.hero_ids = ids;
  }
  return result;
}

const [, , baseFile, mostPlayedFile, highWinrateFile, outputDirectory] = process.argv;
if (!baseFile || !mostPlayedFile || !highWinrateFile || !outputDirectory) throw new Error('Usage: node import-d2pt-hero-grids.js BASE MOST_PLAYED HIGH_WINRATE OUTPUT_DIR');
const base = readToolResult(baseFile);
const mostPlayed = buildGrid(base, readPreview(mostPlayedFile));
const highWinrate = buildGrid(base, readPreview(highWinrateFile));
fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(path.join(outputDirectory, 'most-played.json'), `${JSON.stringify(mostPlayed, null, 2)}\n`);
fs.writeFileSync(path.join(outputDirectory, 'high-winrate.json'), `${JSON.stringify(highWinrate, null, 2)}\n`);