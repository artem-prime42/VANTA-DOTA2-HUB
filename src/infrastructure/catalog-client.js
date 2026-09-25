const fs = require('fs/promises');
const path = require('path');
const { flattenCatalog, normalizeAuthor } = require('../core/models');

const DEFAULT_URL = 'https://raw.githubusercontent.com/artem-prime42/dota2-mod-manager-catalog/main/catalog.json';

class CatalogClient {
  constructor({ rootDir, fetchImpl = fetch, url = DEFAULT_URL } = {}) {
    this.rootDir = rootDir;
    this.fetchImpl = fetchImpl;
    this.url = url;
    this.cacheDir = path.join(rootDir, 'cache');
    this.cacheFile = path.join(this.cacheDir, 'catalog.json');
    this.metaFile = path.join(this.cacheDir, 'catalog-meta.json');
    this.mods = [];
    this.authors = [];
    this.meta = { revision: null, updatedAt: null, offline: false };
  }

  async load({ force = false } = {}) {
    await fs.mkdir(this.cacheDir, { recursive: true });
    let networkError = null;
    if (force || !(await this.exists(this.cacheFile))) {
      try { await this.fetchRemote(); } catch (error) { networkError = error; }
    } else {
      try { await this.fetchRemote(); } catch (error) { networkError = error; }
    }
    if (!this.mods.length) await this.loadCache();
    this.meta.offline = Boolean(networkError);
    await this.loadAuthors();
    if (networkError && !this.mods.length) throw networkError;
    return { mods: this.mods, meta: this.meta };
  }

  async fetchRemote() {
    const separator = this.url.includes('?') ? '&' : '?';
    const requestUrl = `${this.url}${separator}vanta_refresh=${Date.now()}`;
    const response = await this.fetchImpl(requestUrl, { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
    if (!response.ok) throw new Error(`Catalog request failed with HTTP ${response.status}`);
    const payload = await response.json();
    const mods = flattenCatalog(payload);
    if (!mods.length) throw new Error('Catalog response contained no valid mods');
    await fs.writeFile(this.cacheFile, JSON.stringify(payload));
    this.meta = { revision: response.headers.get('etag') || String(Date.now()), updatedAt: new Date().toISOString(), offline: false };
    await fs.writeFile(this.metaFile, JSON.stringify(this.meta));
    this.mods = mods;
    return mods;
  }

  async loadCache() {
    const payload = JSON.parse(await fs.readFile(this.cacheFile, 'utf8'));
    this.mods = flattenCatalog(payload);
    try { this.meta = { ...this.meta, ...JSON.parse(await fs.readFile(this.metaFile, 'utf8')) }; } catch {}
    return this.mods;
  }

  async loadAuthors() {
    const authorsFile = path.join(this.cacheDir, 'authors.json');
    try {
      const response = await this.fetchImpl(this.url.replace(/catalog\.json(?:\?.*)?$/i, 'authors.json'), { cache: 'no-store', headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
      if (!response.ok) throw new Error('Authors request failed');
      const payload = await response.json();
      this.authors = (Array.isArray(payload) ? payload : (Array.isArray(payload.authors) ? payload.authors : [])).map(normalizeAuthor).filter(Boolean);
      this.authors = await Promise.all(this.authors.map(async (author) => {
        if (!author.page) return author;
        try {
          const profileResponse = await this.fetchImpl(new URL(author.page, this.url.replace(/[^/]+$/, '')).toString(), { headers: { accept: 'application/json' } });
          if (!profileResponse.ok) return author;
          return { ...author, ...await profileResponse.json() };
        } catch { return author; }
      }));
      await fs.writeFile(authorsFile, JSON.stringify(this.authors));
    } catch {
      try { this.authors = JSON.parse(await fs.readFile(authorsFile, 'utf8')); } catch { this.authors = []; }
    }
  }

  async exists(file) { try { await fs.access(file); return true; } catch { return false; } }
  getMod(id) { return this.mods.find((mod) => mod.id === id) || null; }
  getCategories() { return [...new Set(this.mods.map((mod) => mod.categoryId))].sort(); }
}

module.exports = { CatalogClient, DEFAULT_URL };