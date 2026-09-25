const HERO_GRID_ROLES = [
  { id: 'all-roles', en: 'All Roles', ru: 'Все роли' },
  { id: 'carry', en: 'Carry', ru: 'Керри' },
  { id: 'mid', en: 'Mid', ru: 'Мид' },
  { id: 'offlane', en: 'Offlane', ru: 'Оффлейн' },
  { id: 'support-4', en: 'Support 4', ru: 'Саппорт 4' },
  { id: 'support-5', en: 'Support 5', ru: 'Саппорт 5' },
];

const HERO_GRID_TYPES = [
  { id: 'most-played', label: 'Most Played', ru: 'Самые популярные' },
  { id: 'high-winrate', label: 'High Winrate', ru: 'Высокий винрейт' },
];

function normalizeRoleKey(roleId) {
  if (roleId === 'soft-support') return 'support-4';
  if (roleId === 'hard-support') return 'support-5';
  return roleId;
}

function heroGridModeById(mode) {
  return HERO_GRID_TYPES.find((item) => item.id === mode) || HERO_GRID_TYPES[0];
}

function heroGridSelectionForRole(selected, roleId) {
  if (!selected || !selected.patch) return 'most-played';
  const selectedRole = normalizeRoleKey(selected.role);
  const selectedType = selected.type || selected.mode || 'most-played';
  return selectedRole === roleId ? selectedType : 'most-played';
}

function heroGridText(en, ru) { return state.data?.settings?.appLanguage === 'ru' ? ru : en; }
function heroGridEscape(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function heroGridModeLabel(mode) {
  const entry = heroGridModeById(mode);
  return heroGridText(entry.label, entry.ru);
}
function heroGridModeInstalled(data, mode) {
  return Boolean(data?.installation?.installed && data.installation.metadata?.patch === data.patches?.[0]?.patch && data.installation.metadata?.type === mode);
}
function heroGridHeroData(hero) {
  const id = Number(hero?.id ?? hero?.heroId ?? 0);
  const rawKey = hero?.key || (hero?.name && String(hero.name).includes('_') ? hero.name : null) || (Number.isFinite(id) && id > 0 ? String(id) : '');
  const key = normalizeHeroId(rawKey);
  const portraitKey = key ? heroPortraitId(key) : null;
  const displayName = hero?.displayName || (key ? key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()) : `Unknown Hero${Number.isFinite(id) && id > 0 ? ` ${id}` : ''}`);
  return { id, key, portraitKey, displayName };
}

function heroGridPortrait(key) { return `${HERO_PORTRAIT_BASE}${heroPortraitId(key || '') || key}.png`; }

function renderHeroGridPreview(preview) {
  return `<div class="hero-grid-preview">${preview.map((category) => `<section class="hero-grid-preview-row"><strong>${heroGridEscape(category.name)}</strong><div class="hero-grid-preview-heroes">${category.heroes.map((hero) => {
    const heroData = heroGridHeroData(hero);
    const title = heroData.displayName || 'Unknown Hero';
    const src = heroData.portraitKey ? `${HERO_PORTRAIT_BASE}${heroData.portraitKey}.png` : '';
    return `<div class="hero-grid-tile" title="${heroGridEscape(title)}"><img loading="lazy" src="${src}" alt="${heroGridEscape(title)}" onerror="this.style.display='none'; this.parentElement.classList.add('is-empty');"><span>${heroGridEscape(title)}</span></div>`;
  }).join('')}</div></section>`).join('')}</div>`;
}

function renderHeroGrids() {
  const data = state.heroGrids;
  if (!data?.patches?.length) {
    $('#content').innerHTML = `<div class="error"><strong>${heroGridText('Hero grids are unavailable', 'Сетки героев недоступны')}</strong>${heroGridText('No valid bundled grid files were found.', 'Не найдено ни одного корректного файла сетки.')}</div>`;
    return;
  }

  const patch = data.patches[0];
  state.heroGridModes ||= {};
  const selected = data.selected || {};
  const installedSelection = data.installation?.installed && data.installation.metadata?.patch === patch.patch ? data.installation.metadata : null;

  $('#content').innerHTML = `
    <div class="hero-grids-page">
      <div class="hero-grids-heading">
        <div>
          <p class="eyebrow">DOTA 2 HERO PLANNING</p>
          <h2>${heroGridText('Hero Grids', 'Сетки героев')}</h2>
          <p>${heroGridText('Verified Dota2ProTracker layouts for the current patch.', 'Проверенные сетки Dota2ProTracker для текущего патча.')}</p>
          <button class="action secondary" data-hero-grid-diagnostics>${heroGridText('Check installation', 'Проверить установку')}</button>
        </div>
        <label class="hero-grid-patch">${heroGridText('Patch', 'Патч')}<select id="hero-grid-patch"><option>${heroGridEscape(patch.patch)}</option></select></label>
      </div>
      <div class="hero-grids-note">${heroGridText('Installing a layout writes the complete Dota 2 hero_grid_config.json and keeps a timestamped backup of your previous file.', 'Установка записывает полный hero_grid_config.json и сохраняет резервную копию предыдущего файла.')}</div>
      <div class="hero-grid-cards">
        ${HERO_GRID_ROLES.map((role) => {
          const mode = state.heroGridModes[role.id] || heroGridSelectionForRole(selected, role.id);
          const modeData = patch.modes.find((item) => item.id === mode) || patch.modes[0];
          const roleData = modeData.roles.find((item) => item.id === role.id) || modeData.roles[0];
          const active = roleData.installed;

          return `
            <article class="hero-grid-card ${active ? 'is-selected' : ''}">
              <div class="hero-grid-card-head">
                <div>
                  <p class="eyebrow">${heroGridEscape(role.en)}</p>
                  <h3>Dota2ProTracker ${heroGridEscape(patch.patch)} - ${heroGridEscape(heroGridText(role.en, role.ru))}</h3>
                  <span>${heroGridModeLabel(mode)}</span>
                </div>
                ${active ? `<b class="hero-grid-selected">✓ ${heroGridText('In use', 'Используется')}</b>` : ''}
              </div>
              <div class="hero-grid-mode" role="tablist">
                ${HERO_GRID_TYPES.map((type) => {
                  const modeInstalled = installedSelection?.role === role.id && installedSelection.type === type.id;
                  return `<button class="filter ${mode === type.id ? 'active' : ''} ${modeInstalled ? 'is-installed' : ''}" data-hero-grid-mode="${type.id}" data-hero-grid-role="${role.id}">${modeInstalled ? '✓ ' : ''}${heroGridModeLabel(type.id)}</button>`;
                }).join('')}
              </div>
              ${renderHeroGridPreview(roleData.preview)}
              ${roleData.installed ? `<button class="action secondary hero-grid-disable" data-hero-grid-disable="${role.id}">${heroGridText('Delete', 'Удалить')}</button>` : `<button class="action hero-grid-apply" data-hero-grid-apply="${role.id}" data-hero-grid-mode-value="${mode}">${heroGridText('Use', 'Использовать')}</button>`}
            </article>
          `;
        }).join('')}
      </div>
      <section class="hero-grid-user-section">
        <div class="hero-grid-user-head">
          <div>
            <p class="eyebrow">${heroGridText('YOUR LAYOUTS', 'ПОЛЬЗОВАТЕЛЬСКИЕ СЕТКИ')}</p>
            <h3>${heroGridText('User Hero Grids', 'Пользовательские сетки')}</h3>
            <p>${heroGridText('Layouts already stored in your Dota 2 configuration.', 'Сетки, которые уже сохранены в конфигурации Dota 2.')}</p>
          </div>
          <button class="action secondary" data-hero-grid-remove-users>${heroGridText('Delete user grids', 'Удалить пользовательские сетки')}</button>
        </div>
        <div id="hero-grid-user-list" class="hero-grid-user-list"><span>${heroGridText('Loading...', 'Загрузка...')}</span></div>
      </section>
    </div>
  `;

  const renderUserGrids = async () => {
    const userData = await call('hero-grids:user-grids');
    const list = document.querySelector('#hero-grid-user-list');
    if (!list) return;
    const userGrids = userData.grids.filter((grid) => !grid.isMeta);
    list.innerHTML = userGrids.length
      ? userGrids.map((grid) => `<div class="hero-grid-user-item"><span>${heroGridEscape(grid.name || heroGridText('Unnamed layout', 'Без названия'))}</span><small>${grid.categories} ${heroGridText('sections', 'секций')}</small><button class="action secondary hero-grid-user-delete" data-hero-grid-user-delete="${grid.index}">${heroGridText('Delete', 'Удалить')}</button></div>`).join('')
      : `<span class="hero-grid-user-empty">${heroGridText('No user layouts found.', 'Пользовательские сетки не найдены.')}</span>`;
  };
  renderUserGrids().catch((error) => { const list = document.querySelector('#hero-grid-user-list'); if (list) list.textContent = error.message; });

  document.querySelector('#hero-grid-user-list')?.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-hero-grid-user-delete]');
    if (!button) return;
    button.disabled = true;
    try {
      await call('hero-grids:remove-user-grid', { index: Number(button.dataset.heroGridUserDelete) });
      state.heroGrids = await call('hero-grids:list');
      toast(heroGridText('User Hero Grid deleted.', 'Пользовательская сетка удалена.'));
      renderHeroGrids();
    } catch (error) {
      button.disabled = false;
      toast(error.message);
    }
  });

  document.querySelectorAll('[data-hero-grid-mode]').forEach((button) => {
    button.onclick = () => {
      state.heroGridModes[button.dataset.heroGridRole] = button.dataset.heroGridMode;
      renderHeroGrids();
    };
  });

  document.querySelector('[data-hero-grid-diagnostics]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const diagnostics = await call('hero-grids:diagnose');
      console.info('[HeroGrid] diagnostics', diagnostics);
      window.alert(JSON.stringify(diagnostics, null, 2));
    } catch (error) {
      toast(error.message);
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector('[data-hero-grid-remove-users]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const result = await call('hero-grids:remove-user-grids');
      state.heroGrids = await call('hero-grids:list');
      toast(heroGridText(`Deleted ${result.removed} user grid(s).`, `Удалено пользовательских сеток: ${result.removed}.`));
      renderHeroGrids();
    } catch (error) {
      button.disabled = false;
      toast(error.message);
    }
  });

  document.querySelectorAll('[data-hero-grid-apply]').forEach((button) => {
    button.onclick = async () => {
      const patchName = patch.patch;
      button.disabled = true;
      button.textContent = heroGridText('Installing...', 'Установка...');
      try {
        await call('hero-grids:apply', {
          patch: patchName,
          type: button.dataset.heroGridModeValue,
          role: button.dataset.heroGridApply,
        });
        state.heroGrids = await call('hero-grids:list');
        toast(heroGridText('Hero grid installed. Restart Dota 2 to apply it.', 'Сетка героев установлена. Перезапустите Dota 2, чтобы применить изменения.'));
        renderHeroGrids();
      } catch (error) {
        button.disabled = false;
        button.textContent = heroGridText('Use', 'Использовать');
        toast(error.message);
      }
    };
  });

  document.querySelectorAll('[data-hero-grid-disable]').forEach((button) => {
    button.onclick = async () => {
      button.disabled = true;
      button.textContent = heroGridText('Disabling...', 'Отключение...');
      try {
        await call('hero-grids:disable');
        state.heroGrids = await call('hero-grids:list');
        toast(heroGridText('Hero grid disabled. Restart Dota 2 to apply the restored configuration.', 'Сетка отключена. Перезапустите Dota 2, чтобы применить восстановленную конфигурацию.'));
        renderHeroGrids();
      } catch (error) {
        button.disabled = false;
        button.textContent = heroGridText('Delete', 'Удалить');
        toast(error.message);
      }
    };
  });
}

async function loadHeroGrids() {
  setTitle();
  $('#content').innerHTML = `<div class="empty"><strong>${heroGridText('Loading hero grids', 'Загрузка сеток героев')}</strong>${heroGridText('Validating bundled Dota 2 configurations...', 'Проверяем конфигурации Dota 2...')}</div>`;
  try {
    state.heroGrids = await call('hero-grids:list');
    renderHeroGrids();
  } catch (error) {
    $('#content').innerHTML = `<div class="error"><strong>${heroGridText('Hero grids could not be loaded', 'Не удалось загрузить сетки героев')}</strong>${heroGridEscape(error.message)}</div>`;
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.nav-item[data-view="hero-grids"]');
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  state.view = 'hero-grids';
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
  loadHeroGrids();
}, true);
