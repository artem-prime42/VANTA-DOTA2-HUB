const { app } = require('electron');
const { autoUpdater } = require('electron-updater');

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

class UpdateService {
  constructor({ getWindow, getAutoCheckEnabled, logger = console }) {
    this.getWindow = getWindow;
    this.getAutoCheckEnabled = getAutoCheckEnabled;
    this.logger = logger;
    this.checkTimer = null;
    this.started = false;
    this.state = { status: 'idle', version: null, progress: 0, error: null };
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.on('checking-for-update', () => this.emit({ status: 'checking' }));
    autoUpdater.on('update-available', (info) => this.emit({ status: 'available', version: info.version, error: null }));
    autoUpdater.on('update-not-available', () => this.emit({ status: 'not-available', version: null, error: null }));
    autoUpdater.on('download-progress', (progress) => this.emit({ status: 'downloading', version: this.state.version, progress: Math.round(progress.percent || 0), bytesPerSecond: progress.bytesPerSecond || 0 }));
    autoUpdater.on('update-downloaded', (info) => this.emit({ status: 'downloaded', version: info.version, progress: 100, error: null }));
    autoUpdater.on('error', (error) => this.fail(error));
  }

  emit(changes) {
    this.state = { ...this.state, ...changes };
    const window = this.getWindow();
    if (window && !window.isDestroyed()) window.webContents.send('update:event', { ...this.state });
  }

  fail(error) {
    this.logger.warn('[updater]', error);
    this.emit({ status: 'error', error: error?.message || String(error), progress: 0 });
  }

  async check({ manual = false } = {}) {
    if (!manual && !this.getAutoCheckEnabled()) return { ...this.state, status: 'disabled' };
    if (!app.isPackaged) {
      this.emit({ status: 'not-available', version: null, error: null });
      return { ...this.state };
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.fail(error);
    }
    return { ...this.state };
  }

  async download() {
    if (this.state.status === 'downloaded') return { ...this.state };
    try {
      this.emit({ status: 'downloading', progress: 0, error: null });
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.fail(error);
    }
    return { ...this.state };
  }

  install() {
    if (this.state.status !== 'downloaded') return false;
    autoUpdater.quitAndInstall(false, true);
    return true;
  }

  start() {
    if (this.started) return;
    this.started = true;
    this.check({ manual: false });
    this.checkTimer = setInterval(() => this.check({ manual: false }), CHECK_INTERVAL_MS);
    this.checkTimer.unref?.();
  }

  stop() {
    if (this.checkTimer) clearInterval(this.checkTimer);
    this.checkTimer = null;
  }
}

module.exports = { CHECK_INTERVAL_MS, UpdateService };
