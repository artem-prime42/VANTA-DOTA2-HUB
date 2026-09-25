const fs = require('fs/promises');
const path = require('path');

const FIRST_PAK_NUMBER = 2;
const LAST_PAK_NUMBER = 99;
const PAK_PATTERN = /^pak(\d{2})_dir\.vpk$/i;

function isPakFilename(value) {
  return PAK_PATTERN.test(String(value || ''));
}

function pakFilename(number) {
  return `pak${String(number).padStart(2, '0')}_dir.vpk`;
}

class VpkLibrary {
  constructor({ rootDir, storage }) {
    this.rootDir = rootDir;
    this.storage = storage;
    this.directory = path.join(rootDir, 'database', 'library');
    this.lockFile = path.join(this.directory, '.pak-allocation.lock');
    this.queue = Promise.resolve();
  }

  async init() {
    await fs.mkdir(this.directory, { recursive: true });
  }

  async exists(file) {
    try { await fs.access(file); return true; } catch { return false; }
  }

  async occupiedFilenames() {
    const occupied = new Set();
    for (const record of Object.values(this.storage.state.installedMods || {})) {
      const fileName = record.fileName || (record.installedFiles || []).find(isPakFilename);
      if (isPakFilename(fileName)) occupied.add(fileName.toLowerCase());
    }
    for (const entry of await fs.readdir(this.directory)) {
      if (isPakFilename(entry)) occupied.add(entry.toLowerCase());
    }
    return occupied;
  }

  async getNextAvailablePakFilename(excludedFileName = null) {
    const occupied = await this.occupiedFilenames();
    if (isPakFilename(excludedFileName)) occupied.delete(excludedFileName.toLowerCase());
    for (let number = FIRST_PAK_NUMBER; number <= LAST_PAK_NUMBER; number += 1) {
      const candidate = pakFilename(number);
      if (!occupied.has(candidate.toLowerCase())) return candidate;
    }
    throw new Error('No free VPK slots available. Available range: pak02_dir.vpk - pak99_dir.vpk');
  }

  async acquireLock() {
    while (true) {
      try {
        const handle = await fs.open(this.lockFile, 'wx');
        return async () => { await handle.close(); await fs.rm(this.lockFile, { force: true }); };
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        try {
          const stat = await fs.stat(this.lockFile);
          if (Date.now() - stat.mtimeMs > 30 * 60 * 1000) await fs.rm(this.lockFile, { force: true });
        } catch (statError) { if (statError.code !== 'ENOENT') throw statError; }
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
  }

  async reserveFileName(preferredFileName = null) {
    await this.init();
    let releaseQueue;
    const previous = this.queue;
    this.queue = new Promise((resolve) => { releaseQueue = resolve; });
    await previous;
    const releaseLock = await this.acquireLock();
    try {
      const fileName = preferredFileName || await this.getNextAvailablePakFilename();
      if (!isPakFilename(fileName)) throw new Error('Invalid VPK filename');
      if (!preferredFileName && await this.exists(path.join(this.directory, fileName))) throw new Error('VPK slot became unavailable');
      return {
        fileName,
        path: path.join(this.directory, fileName),
        release: async () => { await releaseLock(); releaseQueue(); },
      };
    } catch (error) {
      await releaseLock();
      releaseQueue();
      throw error;
    }
  }
}

module.exports = { FIRST_PAK_NUMBER, LAST_PAK_NUMBER, PAK_PATTERN, VpkLibrary, isPakFilename, pakFilename };