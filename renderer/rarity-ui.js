(() => {
  function rarityOf(mod) {
    const rawTags = Array.isArray(mod?.tags)
      ? mod.tags
      : mod?.tags && typeof mod.tags === 'object'
        ? Object.entries(mod.tags).filter(([, value]) => value).map(([key]) => key)
        : [];
    const values = rawTags.map((value) => String(value || '').trim().toLowerCase());
    if (values.some((value) => value === 'arcana' || value.includes('arcana'))) return 'arcana';
    if (values.some((value) => value === 'immortal' || value.includes('immortal'))) return 'immortal';
    return null;
  }

  function rarityBadge(type) {
    return type ? `<span class="rarity-badge rarity-${type}">${type.toUpperCase()}</span>` : '';
  }

  const originalCard = window.card;
  if (typeof originalCard === 'function') {
    window.card = (mod) => {
      const type = rarityOf(mod);
      let html = originalCard(mod);
      if (type) html = html.replace(/(<button class="open-card"[^>]*>)/, `$1${rarityBadge(type)}`);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      wrapper.querySelectorAll('.card-chip').forEach((chip) => {
        if (/^(arcana|immortal)$/i.test(chip.textContent.trim())) chip.remove();
      });
      return wrapper.innerHTML;
    };
  }

  const originalShowDetails = window.showDetails;
  if (typeof originalShowDetails === 'function') {
    window.showDetails = (id) => {
      originalShowDetails(id);
      const mod = state.data.mods.find((item) => item.id === id);
      const type = rarityOf(mod);
      if (!type) return;
      const content = document.querySelector('#details-content');
      if (content && !content.querySelector('.rarity-badge')) content.insertAdjacentHTML('afterbegin', rarityBadge(type));
      content?.querySelectorAll('.card-chip').forEach((chip) => {
        if (/^(arcana|immortal)$/i.test(chip.textContent.trim())) chip.remove();
      });
    };
  }
})();
