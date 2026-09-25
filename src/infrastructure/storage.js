const fs = require('fs/promises');
const path = require('path');

async function safeRename(source, target) {
  if (!source || !target) return;
  if (path.resolve(source) === path.resolve(target)) return;
  await fs.rename(source, target);
}

class JsonStorage {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.file = path.join(rootDir, 'database', 'state.json');
    this.state = { settings: { discordActivityEnabled: true, autoUpdateEnabled: true }, favorites: [], installedMods: {}, downloads: {}, customLoadouts: {}, savedPacks: [] };
  }

  async init() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      const parsed = JSON.parse(await fs.readFile(this.file, 'utf8'));
      this.state = { ...this.state, ...parsed };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.save();
    }
    return this.state;
  }

  async save() {
    const temp = `${this.file}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(temp, JSON.stringify(this.state, null, 2));
      await safeRename(temp, this.file);
    } catch (error) {
      await fs.rm(temp, { force: true });
      throw error;
    }
  }

  async patch(changes) {
    this.state = { ...this.state, ...changes };
    await this.save();
    return this.state;
  }
}

module.exports = { JsonStorage, safeRename };