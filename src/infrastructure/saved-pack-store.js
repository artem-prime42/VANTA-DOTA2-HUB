const fs = require('fs/promises');
const path = require('path');

function sanitizePackName(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return 'Saved pack';
  const safe = trimmed.replace(/[<>:"/\\|?*\x00-\x1F]+/g, ' ').replace(/\s+/g, ' ').trim();
  return safe || 'Saved pack';
}

function safeFolderName(value) {
  const sanitized = sanitizePackName(value).toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return sanitized || `saved-pack-${Date.now()}`;
}

class SavedPackStore {
  constructor({ rootDir }) {
    this.rootDir = rootDir;
    this.directory = path.join(rootDir, 'database', 'saved-packs');
  }

  async init() {
    await fs.mkdir(this.directory, { recursive: true });
  }

  async exists(filePath) {
    try { await fs.access(filePath); return true; } catch { return false; }
  }

  async list() {
    await this.init();
    const entries = await fs.readdir(this.directory, { withFileTypes: true });
    const packs = [];
    for (const entry of entries.filter((item) => item.isDirectory())) {
      const metadataPath = path.join(this.directory, entry.name, 'metadata.json');
      try {
        const raw = await fs.readFile(metadataPath, 'utf8');
        const metadata = JSON.parse(raw);
        const packPath = path.join(this.directory, entry.name, metadata.fileName || 'pack.vpk');
        packs.push({
          ...metadata,
          id: metadata.id || entry.name,
          name: metadata.name || entry.name,
          filePath: packPath,
          exists: await this.exists(packPath),
        });
      } catch {
        continue;
      }
    }
    packs.sort((left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime());
    return packs;
  }

  async get(id) {
    const item = (await this.list()).find((pack) => String(pack.id) === String(id));
    return item || null;
  }

  async save({ name, modIds = [], sourceMods = [], sourcePackId = null, sourceFileName = null, contentHash = null, archivePath }) {
    await this.init();
    const metadataName = sanitizePackName(name);
    const id = `saved-pack-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const folder = path.join(this.directory, id);
    await fs.mkdir(folder, { recursive: true });
    const outputFile = path.join(folder, 'pack.vpk');
    if (archivePath && await this.exists(archivePath)) {
      await fs.copyFile(archivePath, outputFile);
    }
    const metadata = {
      id,
      name: metadataName,
      fileName: 'pack.vpk',
      installedFileName: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourcePackId,
      sourceFileName,
      contentHash,
      modIds: Array.isArray(modIds) ? modIds.filter(Boolean) : [],
      sourceMods: Array.isArray(sourceMods) ? sourceMods : [],
      modCount: (Array.isArray(modIds) ? modIds.filter(Boolean) : []).length,
    };
    await fs.writeFile(path.join(folder, 'metadata.json'), JSON.stringify(metadata, null, 2));
    return { ...metadata, filePath: outputFile, exists: await this.exists(outputFile) };
  }

  async rename(id, name) {
    const pack = await this.get(id);
    if (!pack) throw new Error('Saved pack not found');
    const metadataPath = path.join(this.directory, id, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    metadata.name = sanitizePackName(name);
    metadata.updatedAt = new Date().toISOString();
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    return metadata;
  }

  async update(id, changes) {
    const pack = await this.get(id);
    if (!pack) throw new Error('Saved pack not found');
    const metadataPath = path.join(this.directory, id, 'metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
    const next = { ...metadata, ...changes, updatedAt: new Date().toISOString() };
    await fs.writeFile(metadataPath, JSON.stringify(next, null, 2));
    return next;
  }

  async remove(id) {
    const pack = await this.get(id);
    if (!pack) return false;
    await fs.rm(path.join(this.directory, id), { recursive: true, force: true });
    return true;
  }
}

module.exports = { SavedPackStore, sanitizePackName, safeFolderName };
