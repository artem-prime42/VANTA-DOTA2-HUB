const SETTINGS_SOCIALS = [
  ['Telegram', 'https://t.me/vanta_hubx', 'social-telegram'],
  ['Discord', 'https://discord.gg/hcaQVThnmG', 'social-discord'],
];
function settingsCopy(ru, en) { return state.data?.settings?.appLanguage === 'ru' ? ru : en; }
function applyInterfaceScale(value) { document.documentElement.style.setProperty('--app-ui-scale', String(value || 1)); }

function renderSettings() {
  const gamePath = state.data.gamePath || settingsCopy('Не настроено', 'Not configured');
  const settings = state.data.settings || {};
  const language = settings.appLanguage || 'en';
  applyInterfaceScale(settings.interfaceScale || 1);
  const enabled = (value) => value ? settingsCopy('Включено', 'Enabled') : settingsCopy('Выключено', 'Disabled');
  $('#content').innerHTML = `<div class="settings-panel settings-page">
    <div class="settings-page-heading"><div><p class="eyebrow">VANTA DOTA2 HUB</p><h2>${settingsCopy('Настройки', 'Settings')}</h2><p>${settingsCopy('Подключение игры, поведение интерфейса и обновления приложения.', 'Game connection, interface behavior and application updates.')}</p></div></div>
    <div class="settings-grid">
      <section class="settings-category settings-category-appearance"><h3>${settingsCopy('Внешний вид', 'Appearance')}</h3><p class="settings-category-description">${settingsCopy('Язык и плотность интерфейса VANTA.', 'Language and density of the VANTA interface.')}</p>
        <div class="setting-row"><div><strong>${settingsCopy('Язык интерфейса', 'Application language')}</strong><div class="setting-value">${settingsCopy('Язык интерфейса VANTA', 'VANTA interface language')}</div></div><select id="app-language"><option value="en">${settingsCopy('Английский', 'English')}</option><option value="ru">Русский</option></select></div>
        <div class="setting-row"><div><strong>${settingsCopy('Масштаб интерфейса', 'Interface scale')}</strong><div class="setting-value">${settingsCopy('Настройка плотности интерфейса', 'Adjust interface density')}</div></div><div class="scale-control"><input id="interface-scale" type="range" min="0.8" max="1.4" step="0.05" value="${settings.interfaceScale || 1}"><output id="interface-scale-value">${Number(settings.interfaceScale || 1).toFixed(2)}×</output><button id="reset-interface-scale" class="action secondary">${settingsCopy('Сбросить', 'Reset')}</button></div></div>
      </section>
      <section class="settings-category settings-category-dota"><h3>${settingsCopy('Dota 2 и моды', 'Dota 2 and mods')}</h3><p class="settings-category-description">${settingsCopy('Путь к игре и папка, в которую устанавливаются моды.', 'Game path and the folder used for installed mods.')}</p>
        <div class="setting-row"><div><strong>${settingsCopy('Путь к Dota 2', 'Dota 2 installation')}</strong><div class="setting-value setting-path" title="${gamePath}">${gamePath}</div></div><div class="setting-actions"><button id="detect-game" class="action secondary">${settingsCopy('Определить автоматически', 'Auto detect')}</button><button id="browse-game" class="action">${settingsCopy('Выбрать папку', 'Browse')}</button></div></div>
        <div class="setting-row"><div><strong>${settingsCopy('Папка языка', 'Language folder')}</strong><div class="setting-value">${settingsCopy('Папка файлов модов', 'Mod files language folder')}</div></div><select id="language-folder"><option value="russian">${settingsCopy('Русский', 'Russian')}</option><option value="english">${settingsCopy('Английский', 'English')}</option><option value="schinese">${settingsCopy('Китайский (упрощённый)', 'Simplified Chinese')}</option></select></div>
      </section>
      <section class="settings-category settings-category-activity"><h3>${settingsCopy('Обновления и активность', 'Updates and activity')}</h3><p class="settings-category-description">${settingsCopy('Фоновая проверка обновлений и статус VANTA в Discord.', 'Update checks and VANTA activity in Discord.')}</p>
        <div class="setting-row"><div><strong>${settingsCopy('Автообновление', 'Auto update')}</strong><div class="setting-value">${settingsCopy('Проверять обновления VANTA', 'Check for VANTA updates')}</div></div><button id="auto-update" class="toggle-button ${settings.autoUpdateEnabled !== false ? 'on' : ''}">${enabled(settings.autoUpdateEnabled !== false)}</button></div>
        <div class="setting-row"><div><strong>${settingsCopy('Активность в Discord', 'Discord activity')}</strong><div class="setting-value">${settingsCopy('Показывать активность VANTA в Discord', 'Show VANTA activity in Discord')}</div></div><button id="discord-activity" class="toggle-button ${settings.discordActivityEnabled ? 'on' : ''}">${enabled(settings.discordActivityEnabled)}</button></div>
      </section>
      <section class="settings-category settings-category-about">
        <div class="settings-category-header">
          <span class="app-version-badge">${settingsCopy('Версия', 'Version')} · ${state.data.appVersion || '—'}</span>
          <h3>${settingsCopy('О программе', 'About')}</h3>
        </div>
        <p class="settings-category-description">${settingsCopy('Источник каталога, обновление данных и связь с сообществом.', 'Catalog source, data refresh, and community links.')}</p>
        <div class="setting-row"><div><strong>${settingsCopy('Источник каталога', 'Catalog source')}</strong><div class="setting-value">GitHub · artem-prime42/dota2-mod-manager-catalog</div></div><span class="badge">External</span></div>
        <div class="setting-row"><div><strong>${settingsCopy('Обновление каталога', 'Catalog update')}</strong><div class="setting-value">${settingsCopy('Получить последнюю версию каталога', 'Get the latest catalog version')}</div></div><button id="settings-refresh-catalog" class="action">${settingsCopy('Обновить каталог', 'Refresh catalog')}</button></div>
        <div class="setting-row"><div><strong>${settingsCopy('Обновление VANTA', 'VANTA update')}</strong><div class="setting-value">${settingsCopy('Проверить новую версию приложения', 'Check for a new application version')}</div></div><button id="settings-check-updates" class="action">${settingsCopy('Проверить обновления', 'Check for updates')}</button></div>
        <div class="setting-row"><div><strong>${settingsCopy('Архивы модов', 'Mod archives')}</strong><div class="setting-value">${settingsCopy('Сохраняются для быстрой переустановки без повторной загрузки.', 'Kept for quick reinstalls without downloading again.')}</div><div id="settings-archive-size" class="setting-value">${settingsCopy('Подсчёт размера...', 'Calculating size...')}</div><div id="settings-archive-path" class="setting-value">${settingsCopy('Определение папки...', 'Locating archive folder...')}</div></div><button id="settings-clear-archives" class="action secondary">${settingsCopy('Удалить все архивы', 'Delete all archives')}</button></div>
        <div class="setting-row requested-socials"><div><strong>${settingsCopy('Социальные сети', 'Social networks')}</strong><div class="setting-value">${settingsCopy('Новости и поддержка проекта', 'Project news and support')}</div></div><div class="social-actions">${SETTINGS_SOCIALS.map(([name, url, tone]) => `<a class="social-button ${tone}" href="${url}" target="_blank" rel="noreferrer">${name}</a>`).join('')}</div></div>
      </section>
    </div>
  </div>`;

  const set = async (key, value) => { state.data = await call('settings:set', { key, value }); renderSettings(); };
  $('#detect-game').onclick = async () => { try { state.data = await call('game:detect'); updateGameStatus(state.data.gamePath); renderSettings(); toast(state.data.gamePath ? settingsCopy('Dota 2 найдена.', 'Dota 2 installation detected.') : settingsCopy('Dota 2 не найдена.', 'Dota 2 was not found.')); } catch (error) { toast(error.message); } };
  $('#browse-game').onclick = async () => { try { state.data = await call('game:set-path'); updateGameStatus(state.data.gamePath); renderSettings(); } catch (error) { toast(error.message); } };
  $('#language-folder').value = settings.langSuffix || 'russian';
  $('#app-language').value = language;
  $('#language-folder').onchange = (event) => set('langSuffix', event.target.value);
  $('#app-language').onchange = (event) => set('appLanguage', event.target.value);
  $('#auto-update').onclick = () => set('autoUpdateEnabled', settings.autoUpdateEnabled === false);
  $('#discord-activity').onclick = () => set('discordActivityEnabled', !settings.discordActivityEnabled);
  $('#interface-scale').oninput = (event) => { document.documentElement.style.setProperty('--app-ui-scale', event.target.value); $('#interface-scale-value').value = `${Number(event.target.value).toFixed(2)}×`; };
  $('#interface-scale').onchange = (event) => set('interfaceScale', Number(event.target.value));
  $('#reset-interface-scale').onclick = () => { applyInterfaceScale(1); set('interfaceScale', 1); };
  $('#settings-refresh-catalog').onclick = async (event) => { const button = event.currentTarget; button.disabled = true; try { state.data = await call('catalog:refresh'); toast(settingsCopy('Каталог обновлён.', 'Catalog updated.')); } catch (error) { toast(error.message); } finally { button.disabled = false; } };
  $('#settings-check-updates').onclick = async (event) => { const button = event.currentTarget; button.disabled = true; try { const result = await call('update:check', { manual: true }); if (result.status === 'not-available') toast(settingsCopy('Новых обновлений нет.', 'No updates are available.')); } catch (error) { toast(error.message); } finally { button.disabled = false; } };
  const formatArchiveSize = (bytes) => { const value = Number(bytes || 0); if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`; return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`; };
  const updateArchiveStats = async () => { try { const stats = await call('downloads:stats'); const label = settingsCopy('архивов', 'archives'); $('#settings-archive-size').textContent = `${stats.count} ${label} · ${formatArchiveSize(stats.bytes)}`; $('#settings-archive-path').textContent = `${settingsCopy('Хранятся здесь:', 'Stored in:')} ${(stats.directories || []).join(' · ')}`; } catch { $('#settings-archive-size').textContent = settingsCopy('Размер недоступен', 'Size unavailable'); $('#settings-archive-path').textContent = settingsCopy('Папка недоступна', 'Folder unavailable'); } };
  updateArchiveStats();
  $('#settings-clear-archives').onclick = async (event) => { const button = event.currentTarget; const confirmation = await showAppConfirmDialog({ title: settingsCopy('Удалить архивы?', 'Delete archives?'), message: settingsCopy('Удалить все сохранённые архивы модов?', 'Delete all saved mod archives?'), confirmLabel: settingsCopy('Удалить', 'Delete'), destructive: true }); if (!confirmation.confirmed) return; button.disabled = true; try { await call('downloads:clear'); await updateArchiveStats(); toast(settingsCopy('Архивы удалены.', 'Archives deleted.')); } catch (error) { toast(error.message); } finally { button.disabled = false; } };
}

renderSettings = renderSettings;
