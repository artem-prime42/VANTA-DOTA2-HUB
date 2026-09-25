const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

class DownloadManager {
  constructor(rootDir, onProgress = () => {}, legacyRootDirs = []) { this.rootDir = path.join(rootDir, 'downloads'); this.archiveRoots = [this.rootDir, ...legacyRootDirs.map((directory) => path.join(directory, 'downloads')).filter((directory) => directory !== this.rootDir)]; this.onProgress = onProgress; this.controllers = new Map(); }

  async download(id, url) {
    if (!url) throw new Error('This mod has no download URL');
    await fsp.mkdir(this.rootDir, { recursive: true });
    const destination = path.join(this.rootDir, `${id}.zip`);
    const sourceFile = `${destination}.url`;
    if (await this.exists(destination)) {
      if (!await this.exists(sourceFile) || (await fsp.readFile(sourceFile, 'utf8')) === url) return destination;
    }
    const temporary = `${destination}.part`;
    const controller = new AbortController();
    this.controllers.set(id, controller);
    try {
      let response;
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'VANTA-DOTA2-HUB/0.1', accept: 'application/zip, application/octet-stream, application/vnd.valve.vpk, */*' } });
          if (response.ok) break;
          const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
          lastError = new Error(`Download failed with HTTP ${response.status}`);
          if (!retryable || attempt === 3) throw lastError;
        } catch (error) {
          lastError = error;
          if (controller.signal.aborted || attempt === 3 || error.name === 'AbortError') throw error;
        }
      }
      if (!response?.ok) throw lastError || new Error('Download failed');
      const total = Number(response.headers.get('content-length')) || 0;
      let loaded = 0;
      const output = fs.createWriteStream(temporary);
      if (!response.body) throw new Error('Download returned an empty response body');
      for await (const chunk of response.body) {
        loaded += chunk.length;
        if (!output.write(chunk)) await new Promise((resolve) => output.once('drain', resolve));
        this.onProgress({ id, loaded, total, state: 'downloading' });
      }
      await new Promise((resolve, reject) => output.end((error) => error ? reject(error) : resolve()));
      await fsp.rename(temporary, destination);
      await fsp.writeFile(sourceFile, url);
      this.onProgress({ id, loaded, total, state: 'completed' });
      return destination;
    } catch (error) {
      await fsp.rm(temporary, { force: true });
      const cause = error.cause?.code || error.cause?.message;
      const detail = cause ? `${error.message} (${cause})` : error.message;
      const wrapped = new Error(`Unable to download mod: ${detail}`);
      wrapped.cause = error;
      this.onProgress({ id, state: controller.signal.aborted ? 'canceled' : 'failed', error: wrapped.message });
      throw wrapped;
    } finally { this.controllers.delete(id); }
  }

  cancel(id) { const controller = this.controllers.get(id); if (!controller) return false; controller.abort(); return true; }

  async clear() {
    for (const controller of this.controllers.values()) controller.abort();
    await Promise.all(this.archiveRoots.map(async (archiveRoot) => {
      await fsp.mkdir(archiveRoot, { recursive: true });
      const entries = await fsp.readdir(archiveRoot, { withFileTypes: true });
      await Promise.all(entries.map((entry) => fsp.rm(path.join(archiveRoot, entry.name), { recursive: true, force: true })));
    }));
    return true;
  }

  async getStats() {
    const archives = (await Promise.all(this.archiveRoots.map(async (archiveRoot) => {
      await fsp.mkdir(archiveRoot, { recursive: true });
      const entries = await fsp.readdir(archiveRoot, { withFileTypes: true });
      return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.zip')).map((entry) => path.join(archiveRoot, entry.name));
    }))).flat();
    const sizes = await Promise.all(archives.map((archive) => fsp.stat(archive)));
    return { count: archives.length, bytes: sizes.reduce((total, stat) => total + stat.size, 0), directories: [this.rootDir] };
  }

  async exists(file) { try { await fsp.access(file); return true; } catch { return false; } }
}

module.exports = { DownloadManager };