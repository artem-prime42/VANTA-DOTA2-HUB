const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { discoverSteamRoots } = require('./hero-grid-installer');

function libraryPaths(text) {
  return [...String(text || '').matchAll(/"path"\s+"([^"]+)"/g)].map((match) => match[1].replace(/\\\\/g, path.sep));
}

async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }

async function detectDotaInstallation() {
  const libraries = await discoverSteamRoots({ platform: process.platform, home: os.homedir(), env: process.env });
  const seen = new Set();
  for (const library of libraries) {
    const game = path.join(library, 'steamapps/common/dota 2 beta/game');
    const direct = path.join(library, 'dota');
    for (const candidate of [game, library]) {
      const normalized = path.resolve(candidate);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      const dotaPath = path.join(candidate, 'dota');
      const pak01Path = path.join(dotaPath, 'pak01_dir.vpk');
      if (await exists(pak01Path)) {
        const vpkFiles = [];
        try {
          const entries = await fs.readdir(dotaPath);
          for (const entry of entries) {
            if (/\.vpk$/i.test(entry) && /_dir\.vpk$/i.test(entry)) vpkFiles.push(path.join(dotaPath, entry));
          }
        } catch {}
        return { detected: true, gamePath: candidate, dotaPath, pak01Path, vpkFiles };
      }
      if (await exists(dotaPath) && candidate === direct) {
        return { detected: true, gamePath: candidate, dotaPath, pak01Path: path.join(dotaPath, 'pak01_dir.vpk'), vpkFiles: [] };
      }
    }
  }
  return { detected: false, gamePath: null, dotaPath: null, pak01Path: null, vpkFiles: [] };
}

async function detectDota() {
  const result = await detectDotaInstallation();
  if (!result.detected) return null;
  return { gamePath: result.gamePath, dotaPath: result.dotaPath };
}

async function validateDota(gamePath) {
  return Boolean(gamePath && await exists(path.join(gamePath, 'dota/pak01_dir.vpk')));
}

module.exports = { detectDota, detectDotaInstallation, validateDota };