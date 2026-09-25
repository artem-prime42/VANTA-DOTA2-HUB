const fs = require('fs/promises');
const path = require('path');
const crypto = require('node:crypto');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

const CONFIG_NAME = 'hero_grid_config.json';
const STEAM_ID_PATTERN = /^\d+$/;

async function exists(filePath) {
  try { await fs.access(filePath); return true; } catch { return false; }
}

async function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function hashFile(filePath) {
  return hashText(await fs.readFile(filePath));
}

function validateConfig(config) {
  if (!config || typeof config !== 'object' || config.version !== 3 || !Array.isArray(config.configs) || !config.configs.length) {
    throw new Error('Hero Grid configuration is invalid');
  }
  for (const configEntry of config.configs) {
    if (!configEntry || typeof configEntry.config_name !== 'string' || !Array.isArray(configEntry.categories)) throw new Error('Hero Grid categories are missing');
    for (const category of configEntry.categories) {
      if (!category || typeof category.category_name !== 'string' || !Array.isArray(category.hero_ids)) {
        throw new Error('Hero Grid category is invalid');
      }
      if (![category.x_position, category.y_position, category.width, category.height].every((value) => Number.isFinite(Number(value)) && Number(value) >= 0)) throw new Error('Hero Grid category dimensions are invalid');
      if (category.hero_ids.some((id) => !Number.isInteger(id) || id < 1)) throw new Error('Hero Grid contains invalid hero IDs');
    }
  }
  return config;
}

function parseConfig(text) {
  let config;
  try { config = JSON.parse(text); } catch { throw new Error('Hero Grid configuration is invalid JSON'); }
  return validateConfig(config);
}

function unique(values) { return [...new Set(values.filter(Boolean).map((value) => path.resolve(value)))]; }

function parentPaths(start, limit = 7) {
  const result = [];
  let current = path.resolve(start || path.parse(process.cwd()).root);
  for (let index = 0; index < limit; index += 1) {
    result.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return result;
}

function parseLibraryPaths(text) {
  return [...String(text || '').matchAll(/"path"\s+"([^"]+)"/g)].map((match) => match[1].replace(/\\\\/g, path.sep));
}

async function activeSteamIds(userdataRoot) {
  const loginUsersPath = path.join(path.dirname(userdataRoot), 'config', 'loginusers.vdf');
  let text;
  try { text = await fs.readFile(loginUsersPath, 'utf8'); } catch { return []; }
  const accounts = [];
  for (const match of String(text).matchAll(/"(\d{17})"\s*\{([\s\S]*?)\}/g)) {
    const steam64 = BigInt(match[1]);
    const steam3 = String(steam64 - 76561197960265728n);
    const block = match[2];
    const autoLogin = /"AutoLogin"\s+"1"/i.test(block);
    const timestamp = Number(block.match(/"Timestamp"\s+"(\d+)"/i)?.[1] || 0);
    accounts.push({ steamId: steam3, autoLogin, timestamp });
  }
  return accounts.sort((left, right) => Number(right.autoLogin) - Number(left.autoLogin) || right.timestamp - left.timestamp).map((account) => account.steamId);
}

async function readDirectory(directory) {
  try { return await fs.readdir(directory, { withFileTypes: true }); } catch { return []; }
}

async function processRunning(name, platform = process.platform) {
  try {
    if (platform === 'win32') {
      const result = await execFileAsync('tasklist', ['/FI', `IMAGENAME eq ${name}.exe`, '/NH'], { windowsHide: true });
      return new RegExp(`^${name}\.exe\\s`, 'im').test(String(result.stdout || ''));
    }
    const result = await execFileAsync('pgrep', ['-x', name]);
    return Boolean(String(result.stdout || '').trim());
  } catch { return false; }
}

async function runningSteamRoots(platform = process.platform) {
  if (platform === 'win32') return [];
  const roots = [];
  for (const entry of await readDirectory('/proc')) {
    if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue;
    let command;
    try { command = (await fs.readFile(path.join('/proc', entry.name, 'cmdline'))).toString('utf8').replace(/\0/g, ' '); } catch { continue; }
    const match = command.match(/(\/[^ ]*\/Steam)\/ubuntu\d+_\d+\/steam(?:\s|$)/i) || command.match(/(\/[^ ]*\/Steam)\/steam\.sh(?:\s|$)/i);
    if (match) roots.push(match[1]);
  }
  return unique(roots);
}

async function runningRootsForGame(gamePath, roots) {
  if (!gamePath) return [];
  const gameReal = await fs.realpath(gamePath).catch(() => path.resolve(gamePath));
  const matching = [];
  for (const root of roots) {
    const libraries = [root];
    for (const file of [path.join(root, 'steamapps/libraryfolders.vdf'), path.join(root, 'steamapps/libraryfolders.vdf.bak')]) {
      try { libraries.push(...parseLibraryPaths(await fs.readFile(file, 'utf8'))); } catch {}
    }
    for (const library of unique(libraries)) {
      const libraryReal = await fs.realpath(library).catch(() => path.resolve(library));
      if (gameReal === libraryReal || gameReal.startsWith(`${libraryReal}${path.sep}`)) {
        matching.push(root);
        break;
      }
    }
  }
  return unique(matching);
}

async function steamRoots(platform = process.platform, home = os.homedir(), env = process.env) {
  if (platform === 'win32') {
    const roots = [
      env.ProgramFiles ? path.join(env.ProgramFiles, 'Steam') : null,
      env['ProgramFiles(x86)'] ? path.join(env['ProgramFiles(x86)'], 'Steam') : null,
      env.LOCALAPPDATA ? path.join(env.LOCALAPPDATA, 'Steam') : null,
      'C:/Steam',
    ];
    if (platform === 'win32') {
      for (const key of ['HKCU\\Software\\Valve\\Steam', 'HKLM\\Software\\Valve\\Steam', 'HKLM\\Software\\WOW6432Node\\Valve\\Steam']) {
        try {
          const result = await execFileAsync('reg', ['query', key, '/v', 'SteamPath'], { windowsHide: true });
          const match = String(result.stdout || '').match(/SteamPath\s+REG_SZ\s+(.+)/i);
          if (match) roots.push(match[1].trim());
        } catch {}
      }
    }
    return unique(roots);
  }
  return unique([
    path.join(home, '.steam', 'steam'),
    path.join(home, '.steam', 'root', 'steam'),
    path.join(home, '.steam', 'debian-installation'),
    path.join(home, '.local', 'share', 'Steam'),
    path.join(home, '.var', 'app', 'com.valvesoftware.Steam', '.steam', 'steam'),
  ]);
}

async function discoverSteamRoots({ gamePath, platform = process.platform, home = os.homedir(), env = process.env } = {}) {
  const roots = [...parentPaths(gamePath).filter((item) => path.basename(item).toLowerCase() === 'steam'), ...(await steamRoots(platform, home, env))];
  for (const root of [...roots]) {
    for (const file of [path.join(root, 'steamapps', 'libraryfolders.vdf'), path.join(root, 'steamapps', 'libraryfolders.vdf.bak')]) {
      try { roots.push(...parseLibraryPaths(await fs.readFile(file, 'utf8'))); } catch {}
    }
  }
  return unique(roots);
}

async function userdataCandidates({ gamePath, platform, home, env } = {}) {
  const roots = await discoverSteamRoots({ gamePath, platform, home, env });
  const candidates = [];
  for (const root of roots) candidates.push(path.join(root, 'userdata'));
  for (const parent of parentPaths(gamePath)) candidates.push(path.join(parent, 'userdata'));
  return unique(candidates);
}

async function findConfigTargets(options = {}) {
  const userdataRoots = await userdataCandidates(options);
  const localRoots = new Set(parentPaths(options.gamePath).map((parent) => path.resolve(path.join(parent, 'userdata'))));
  const runningRoots = new Set((await runningRootsForGame(options.gamePath, options.runningSteamRoots || [])).map((root) => path.resolve(path.join(root, 'userdata'))));
  const accounts = [];
  for (const userdataRoot of userdataRoots) {
    const activeIds = await activeSteamIds(userdataRoot);
    for (const entry of await readDirectory(userdataRoot)) {
      if (!entry.isDirectory() || !STEAM_ID_PATTERN.test(entry.name)) continue;
      const remoteDir = path.join(userdataRoot, entry.name, '570', 'remote');
      const cfgDir = path.join(remoteDir, 'cfg');
      const cfgPath = path.join(cfgDir, CONFIG_NAME);
      const remotePath = path.join(remoteDir, CONFIG_NAME);
      const cfgStat = await fs.stat(cfgPath).catch(() => null);
      const remoteStat = await fs.stat(remotePath).catch(() => null);
      const configPath = cfgStat ? cfgPath : (remoteStat ? remotePath : cfgPath);
      const stat = cfgStat || remoteStat;
      accounts.push({ steamId: entry.name, userdataRoot, remoteDir, cfgDir, configPath, configCandidates: [cfgPath, remotePath], hasConfig: Boolean(stat), mtimeMs: stat?.mtimeMs || 0, local: localRoots.has(path.resolve(userdataRoot)), running: runningRoots.has(path.resolve(userdataRoot)), active: activeIds[0] === entry.name });
    }
  }
  const seen = new Set();
  return accounts.filter((account) => {
    if (seen.has(account.configPath)) return false;
    seen.add(account.configPath);
    return true;
  });
}

class HeroGridInstaller {
  constructor({ rootDir, getGamePath, platform = process.platform, home = os.homedir(), env = process.env }) {
    this.rootDir = rootDir;
    this.getGamePath = getGamePath;
    this.platform = platform;
    this.home = home;
    this.env = env;
    this.metadataPath = path.join(rootDir, 'database', 'hero-grid-install.json');
  }

  log(message, value) { console.info(`[HeroGrid] ${message}${value === undefined ? '' : ` ${value}`}`); }

  async readMetadata() {
    try { return JSON.parse(await fs.readFile(this.metadataPath, 'utf8')); } catch { return null; }
  }

  async writeMetadata(metadata) {
    await fs.mkdir(path.dirname(this.metadataPath), { recursive: true });
    const temp = `${this.metadataPath}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(temp, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
      await fs.rename(temp, this.metadataPath);
    } catch (error) {
      await fs.rm(temp, { force: true });
      throw error;
    }
  }

  async refreshInstalledHash(targetPath) {
    const metadata = await this.readMetadata();
    if (!metadata || metadata.targetPath !== targetPath) return;
    metadata.installedFileHash = await hashFile(targetPath);
    await this.writeMetadata(metadata);
  }

  async targetForInstall() {
    const gamePath = this.getGamePath?.();
    this.log('Detecting Steam...');
    const accounts = await findConfigTargets({ gamePath, platform: this.platform, home: this.home, env: this.env, runningSteamRoots: await runningSteamRoots(this.platform) });
    const metadata = await this.readMetadata();
    const preferredId = metadata?.steamId;
    const running = accounts.filter((account) => account.running);
    const runningActive = running.filter((account) => account.active);
    if (runningActive.length === 1) { this.log('Using active account from running Steam root:', runningActive[0].steamId); return runningActive[0]; }
    if (running.length === 1) { this.log('Using running Steam root:', running[0].userdataRoot); return running[0]; }
    const preferred = accounts.find((account) => account.steamId === preferredId);
    if (preferred) { this.log('Steam ID:', preferred.steamId); return preferred; }
    const local = accounts.filter((account) => account.local);
    const active = local.filter((account) => account.active);
    if (active.length === 1) { this.log('Steam ID:', active[0].steamId); return active[0]; }
    if (local.length === 1) { this.log('Steam ID:', local[0].steamId); return local[0]; }
    const localWithConfig = local.filter((account) => account.hasConfig).sort((left, right) => right.mtimeMs - left.mtimeMs);
    if (localWithConfig.length === 1) return localWithConfig[0];
    const withConfig = accounts.filter((account) => account.hasConfig).sort((left, right) => right.mtimeMs - left.mtimeMs);
    if (withConfig.length === 1) return withConfig[0];
    if (accounts.length === 1) return accounts[0];
    if (!accounts.length) throw new Error('Steam userdata was not found. Please configure Steam or Dota 2 first.');
    throw new Error('Multiple Steam accounts were found. Open Steam with the desired account and try again.');
  }

  async detect() {
    const metadata = await this.readMetadata();
    if (!metadata?.targetPath || !metadata.installedFileHash) return { installed: false, metadata: null };
    if (!(await exists(metadata.targetPath))) return { installed: false, metadata };
    const currentHash = await hashFile(metadata.targetPath);
    return { installed: currentHash === metadata.installedFileHash, metadata: currentHash === metadata.installedFileHash ? metadata : null, currentHash };
  }

  async currentConfig() {
    const target = await this.targetForInstall().catch(() => null);
    if (!target || !(await exists(target.configPath))) return { target: target || null, config: null, text: null };
    const text = await fs.readFile(target.configPath, 'utf8');
    try { return { target, config: parseConfig(text), text }; } catch { return { target, config: null, text }; }
  }

  async removeUserConfigs({ isMetaConfig = (config) => /^Dota2ProTracker\b/i.test(String(config?.config_name || '')) } = {}) {
    if (await processRunning('dota2', this.platform)) throw new Error('Close Dota 2 before removing Hero Grids.');
    const current = await this.currentConfig();
    if (!current.target || !current.config) throw new Error('No valid Hero Grid configuration was found.');
    const userConfigs = current.config.configs.filter((config) => !isMetaConfig(config));
    if (!userConfigs.length) return { removed: 0, target: current.target.configPath };
    const keptConfigs = current.config.configs.filter(isMetaConfig);
    if (!keptConfigs.length) throw new Error('No standard Hero Grid layouts would remain.');
    const nextConfig = { ...current.config, configs: keptConfigs };
    validateConfig(nextConfig);
    const backupPath = `${current.target.configPath}.vanta-users-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(backupPath, current.text, { flag: 'wx' });
    if ((await fs.readFile(backupPath, 'utf8')) !== current.text) throw new Error('Backup verification failed. Removal cancelled.');
    const temporary = `${current.target.configPath}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8');
      parseConfig(await fs.readFile(temporary, 'utf8'));
      await fs.rename(temporary, current.target.configPath);
    } catch (error) {
      await fs.rm(temporary, { force: true });
      throw new Error(`User Hero Grid removal failed: ${error.message}`);
    }
    await this.refreshInstalledHash(current.target.configPath);
    return { removed: userConfigs.length, kept: keptConfigs.length, backupPath, target: current.target.configPath };
  }

  async removeUserConfig(index) {
    if (await processRunning('dota2', this.platform)) throw new Error('Close Dota 2 before removing Hero Grids.');
    const current = await this.currentConfig();
    const configIndex = Number(index);
    const entry = current.config?.configs?.[configIndex];
    if (!current.target || !current.config || !entry) throw new Error('User Hero Grid was not found.');
    if (/^Dota2ProTracker\b/i.test(String(entry.config_name || ''))) throw new Error('Standard Dota2ProTracker grids cannot be removed here.');
    const nextConfig = { ...current.config, configs: current.config.configs.filter((_, itemIndex) => itemIndex !== configIndex) };
    if (!nextConfig.configs.length) throw new Error('At least one Hero Grid must remain.');
    validateConfig(nextConfig);
    const backupPath = `${current.target.configPath}.vanta-user-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(backupPath, current.text, { flag: 'wx' });
    if ((await fs.readFile(backupPath, 'utf8')) !== current.text) throw new Error('Backup verification failed. Removal cancelled.');
    const temporary = `${current.target.configPath}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8');
      parseConfig(await fs.readFile(temporary, 'utf8'));
      await fs.rename(temporary, current.target.configPath);
    } catch (error) {
      await fs.rm(temporary, { force: true });
      throw new Error(`User Hero Grid removal failed: ${error.message}`);
    }
    await this.refreshInstalledHash(current.target.configPath);
    return { removed: 1, name: entry.config_name, backupPath, target: current.target.configPath };
  }

  async diagnostics() {
    const gamePath = this.getGamePath?.() || null;
    const runningRoots = await runningSteamRoots(this.platform);
    const accounts = await findConfigTargets({ gamePath, platform: this.platform, home: this.home, env: this.env, runningSteamRoots: runningRoots });
    const active = accounts.filter((account) => account.running && account.active);
    const target = active.length === 1 ? active[0] : accounts.find((account) => account.local && account.active) || null;
    const file = target?.configPath || null;
    const stat = file ? await fs.lstat(file).catch(() => null) : null;
    const content = file && stat ? await fs.readFile(file).catch(() => null) : null;
    const parsed = content ? (() => { try { return parseConfig(content.toString('utf8')); } catch { return null; } })() : null;
    const running = { dota2: await processRunning('dota2', this.platform), steam: await processRunning('steam', this.platform) };
    return {
      os: this.platform,
      steamPath: target ? path.dirname(target.userdataRoot) : (runningRoots[0] || null),
      steamUserdata: target?.userdataRoot || null,
      steamId: target?.steamId || null,
      dotaDirectory: gamePath,
      heroGridDirectory: target?.cfgDir || target?.remoteDir || null,
      heroGridFile: file,
      alternateFiles: target?.configCandidates || [],
      fileExists: Boolean(stat),
      fileSize: stat?.size || 0,
      lastModified: stat?.mtime?.toISOString() || null,
      sha256: content ? await hashText(content) : null,
      symlink: Boolean(stat?.isSymbolicLink?.()),
      symlinkTarget: stat?.isSymbolicLink?.() ? await fs.realpath(file).catch(() => null) : null,
      owner: stat ? (await fs.stat(file).catch(() => null))?.uid : null,
      mode: stat ? `0${(stat.mode & 0o777).toString(8)}` : null,
      jsonValid: Boolean(parsed),
      version: parsed?.version || null,
      configs: parsed?.configs?.length || 0,
      dotaRunning: running.dota2,
      steamRunning: running.steam,
      candidates: accounts.map((account) => ({ steamId: account.steamId, userdataRoot: account.userdataRoot, active: account.active, running: account.running, local: account.local, hasConfig: account.hasConfig })),
    };
  }

  async install({ config, patch, role, type }) {
    validateConfig(config);
    if (await processRunning('dota2', this.platform)) throw new Error('Close Dota 2 before installing a Hero Grid.');
    this.log('Dota running: false');
    const target = await this.targetForInstall();
    this.log('Config path:', target.configPath);
    await fs.mkdir(target.cfgDir, { recursive: true });
    const targetPath = target.configPath;
    const originalExists = await exists(targetPath);
    const originalText = originalExists ? await fs.readFile(targetPath, 'utf8') : null;
    if (originalExists) {
      try {
        const previous = parseConfig(originalText);
        const userConfigs = previous.configs.filter((entry) => !/^Dota2ProTracker\b/i.test(String(entry.config_name || '')));
        config = { ...config, configs: [...config.configs, ...userConfigs] };
      } catch {}
    }
    validateConfig(config);
    const sourceText = `${JSON.stringify(config, null, 2)}\n`;
    parseConfig(sourceText);
    const installedFileHash = await hashText(sourceText);
    let backupPath = null;
    if (originalExists) {
      this.log('Reading current config...');
      backupPath = `${targetPath}.vanta-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      await fs.writeFile(backupPath, originalText, { flag: 'wx' });
      if ((await fs.readFile(backupPath, 'utf8')) !== originalText) throw new Error('Backup verification failed. Installation cancelled.');
      this.log('Backup created:', backupPath);
    }
    const temporary = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
    let replaced = false;
    try {
      await fs.writeFile(temporary, sourceText, 'utf8');
      this.log('Writing temporary config:', temporary);
      parseConfig(await fs.readFile(temporary, 'utf8'));
      this.log('Validating JSON...');
      if (originalExists) {
        const displaced = `${targetPath}.${process.pid}.${Date.now()}.original`;
        await fs.rename(targetPath, displaced);
        try { await fs.rename(temporary, targetPath); } catch (error) { await fs.rename(displaced, targetPath).catch(() => {}); throw error; }
        await fs.rm(displaced, { force: true });
      } else {
        await fs.rename(temporary, targetPath);
      }
      replaced = true;
      if ((await hashFile(targetPath)) !== installedFileHash) throw new Error('Installed Hero Grid failed verification.');
      this.log('SHA256 verified:', installedFileHash);
    } catch (error) {
      await fs.rm(temporary, { force: true });
      if (replaced) {
        if (originalExists) await fs.writeFile(targetPath, originalText, 'utf8').catch(() => {});
        else await fs.rm(targetPath, { force: true });
      }
      throw new Error(`Hero Grid installation failed: ${error.message}`);
    }
    const metadata = { version: 1, steamId: target.steamId, targetPath, installedFileHash, backupPath, hadOriginal: originalExists, patch, role, type, installedAt: new Date().toISOString() };
    try { await this.writeMetadata(metadata); } catch (error) {
      if (originalExists) await fs.writeFile(targetPath, originalText, 'utf8').catch(() => {}); else await fs.rm(targetPath, { force: true });
      throw new Error(`Hero Grid installation failed: ${error.message}`);
    }
    return { installed: true, metadata };
  }

  async disable() {
    const detected = await this.detect();
    const metadata = detected.metadata;
    if (!detected.installed || !metadata) throw new Error('The active Hero Grid is not owned by VANTA.');
    if (metadata.backupPath && await exists(metadata.backupPath)) {
      const restored = `${metadata.targetPath}.${process.pid}.${Date.now()}.restore`;
      await fs.copyFile(metadata.backupPath, restored);
      const displaced = `${metadata.targetPath}.${process.pid}.${Date.now()}.installed`;
      await fs.rename(metadata.targetPath, displaced);
      try {
        await fs.rename(restored, metadata.targetPath);
      } catch (error) {
        await fs.rename(displaced, metadata.targetPath).catch(() => {});
        await fs.rm(restored, { force: true });
        throw new Error(`Hero Grid restore failed: ${error.message}`);
      }
      await fs.rm(displaced, { force: true });
    } else {
      await fs.rm(metadata.targetPath, { force: true });
    }
    await fs.rm(this.metadataPath, { force: true });
    return { installed: false, restored: Boolean(metadata.backupPath) };
  }
}

module.exports = { HeroGridInstaller, discoverSteamRoots, findConfigTargets, runningSteamRoots, validateConfig, parseConfig };
