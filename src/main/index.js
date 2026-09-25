const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { Client } = require('discord-rpc');
const { AppService } = require('./services/app-service');
const { UpdateService } = require('./services/update-service');

const DISCORD_APP_ID = '1551207182744166511';

let presenceClient = null;

async function updateDiscordPresence() {
  const settings = service?.storage?.state?.settings || {};
  const enabled = settings.discordActivityEnabled !== false;
  if (!enabled) {
    if (presenceClient) {
      try { await presenceClient.clearActivity(); } catch {}
    }
    return;
  }
  if (!presenceClient) {
    presenceClient = new Client({ transport: 'ipc' });
  }
  try {
    if (!presenceClient.user) {
      await presenceClient.login({ clientId: DISCORD_APP_ID });
    }
    await presenceClient.setActivity({
      details: 'VANTA DOTA2 HUB',
      state: service?.gamePath ? 'Managing Dota 2 mods' : 'Configuring the app',
      startTimestamp: Date.now(),
      largeImageKey: 'vanta',
      largeImageText: 'VANTA DOTA2 HUB',
      smallImageKey: 'dota2',
      smallImageText: 'Dota 2',
      instance: false,
    });
  } catch (error) {
    console.error('[discord-rpc]', error);
  }
}

let service;
let updater;
if (process.platform === 'linux') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('log-level', '3');
}
function register(channel, handler) { ipcMain.handle(channel, async (_event, payload) => { try { return { ok: true, data: await handler(payload) }; } catch (error) { console.error(`[${channel}]`, error); return { ok: false, error: error.message }; } }); }

async function createWindow() {
  Menu.setApplicationMenu(null);
  app.setName('VANTA DOTA2 HUB');
  service = new AppService({ rootDir: app.getPath('userData'), onProgress: (event) => BrowserWindow.getAllWindows().forEach((window) => window.webContents.send('download:progress', event)) });
  const window = new BrowserWindow({ width: 1440, height: 920, minWidth: 960, minHeight: 640, frame: false, backgroundColor: '#111315', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  updater = new UpdateService({ getWindow: () => window, getAutoCheckEnabled: () => service?.storage?.state?.settings?.autoUpdateEnabled !== false });
  ipcMain.handle('window:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
  ipcMain.handle('window:toggle-maximize', (event) => { const current = BrowserWindow.fromWebContents(event.sender); if (current?.isMaximized()) current.unmaximize(); else current?.maximize(); return current?.isMaximized(); });
  ipcMain.handle('window:toggle-fullscreen', (event) => { const current = BrowserWindow.fromWebContents(event.sender); current?.setFullScreen(!current.isFullScreen()); return current?.isFullScreen(); });
  ipcMain.handle('window:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close());
  register('app:init', async () => { const result = await service.init(); await updateDiscordPresence(); updater.start(); return { ...result, appVersion: app.getVersion() }; });
  register('catalog:list', async (payload) => { const result = await service.getCatalog(payload); await updateDiscordPresence(); return result; });
  register('catalog:refresh', () => service.refreshCatalog());
  register('favorite:toggle', ({ id }) => service.toggleFavorite(id));
  register('game:detect', () => service.detectGame());
  register('game:set-path', async () => { const result = await dialog.showOpenDialog(window, { properties: ['openDirectory'] }); if (result.canceled) return service.snapshot(); const resultData = await service.setGamePath(result.filePaths[0]); await updateDiscordPresence(); return resultData; });
  register('game:language-folders', () => service.getLanguageFolders());
  register('game:open-mods-folder', () => service.openModsFolder());
  register('mod:install', ({ id }) => service.install(id));
  register('mod:update', ({ id }) => service.update(id));
  register('mod:uninstall', ({ id }) => service.uninstall(id));
  register('mod:set-enabled', ({ id, enabled }) => service.setModEnabled(id, enabled));
  register('mod:merge', ({ ids, name }) => service.mergeMods(ids, name));
  register('mod:reorder', ({ ids }) => service.reorderLibrary(ids));
  register('mod:rename-pack', ({ id, name }) => service.renamePack(id, name));
  register('mod:rename', ({ id, name }) => service.renameLibraryItem(id, name));
  register('mod:rebuild-pack', ({ id }) => service.rebuildPack(id));
  register('library:get', () => service.getLibrary());
  register('library:import', async ({ displayName } = {}) => { const result = await dialog.showOpenDialog(window, { properties: ['openFile'], filters: [{ name: 'VPK files', extensions: ['vpk'] }] }); if (result.canceled) return service.getLibrary(); return service.importVpk(result.filePaths[0], displayName); });
  register('library:save-pack', ({ name, modIds }) => service.savePack(name, modIds));
  register('library:delete-pack', ({ id }) => service.deletePack(id));
  register('saved-packs:list', () => service.listSavedPacks());
  register('saved-packs:contents', ({ id }) => service.getSavedPackContents(id));
  register('saved-packs:save', ({ name, packId, modIds }) => service.saveSavedPack({ name, packId, modIds }));
  register('saved-packs:activate', ({ id }) => service.activateSavedPack(id));
  register('library:pack-contents', ({ id }) => service.getLibraryPackContents(id));
  register('saved-packs:rename', ({ id, name }) => service.renameSavedPack(id, name));
  register('saved-packs:delete', ({ id }) => service.deleteSavedPack(id));
  register('external:set-enabled', ({ relativePath, enabled }) => service.setExternalEnabled(relativePath, enabled));
  register('external:remove', ({ relativePath }) => service.removeExternal(relativePath));
  register('download:cancel', ({ id }) => service.cancelDownload(id));
  register('downloads:clear', () => service.clearDownloadArchives());
  register('downloads:stats', () => service.getDownloadArchiveStats());
  register('settings:get', () => service.getSettings());
  register('hero-grids:list', () => service.getHeroGrids());
  register('hero-grids:diagnose', () => service.diagnoseHeroGrid());
  register('hero-grids:user-grids', () => service.getHeroGridUserGrids());
  register('hero-grids:apply', (payload) => service.applyHeroGrid(payload));
  register('hero-grids:disable', () => service.disableHeroGrid());
  register('hero-grids:remove-user-grids', () => service.removeHeroGridUserGrids());
  register('hero-grids:remove-user-grid', ({ index }) => service.removeHeroGridUserGrid(index));
  register('settings:set', async ({ key, value }) => { const result = await service.setSetting(key, value); await updateDiscordPresence(); return result; });
  register('update:check', ({ manual } = {}) => updater.check({ manual: manual !== false }));
  register('update:download', () => updater.download());
  register('update:install', () => updater.install());
  await window.loadFile(path.join(__dirname, '../../renderer/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });