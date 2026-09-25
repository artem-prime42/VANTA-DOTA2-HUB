function syncLibraryBulkUi() {
  const panel = document.querySelector('.library-bulk');
  if (!panel) return;
  const selectedCount = state.librarySelection.size;
  panel.classList.toggle('has-selection', selectedCount > 0);
  let count = panel.querySelector('.floating-selection-count');
  if (!count) {
    panel.insertAdjacentHTML('afterbegin', '<button class="floating-selection-cancel" title="Cancel selection" aria-label="Cancel selection">×</button><span class="floating-selection-count"></span>');
    panel.querySelector('.floating-selection-cancel').onclick = () => { state.librarySelection.clear(); renderLibrary(); };
    panel.insertAdjacentHTML('beforeend', '<button class="action secondary floating-merge">Merge mods</button>');
    panel.querySelector('.floating-merge').onclick = async () => {
      const managed = [...state.librarySelection].filter((id) => !id.startsWith('external:'));
      if (managed.length < 2) return toast('Select at least two managed mods to create a pack.');
      openMergePackDialog(managed);
    };
    count = panel.querySelector('.floating-selection-count');
  }
  count.textContent = `${selectedCount} selected`;
  panel.querySelectorAll('.action').forEach((button) => { button.disabled = selectedCount === 0; });
    const managedCount = [...state.librarySelection].filter((id) => !id.startsWith('external:')).length;
    const merge = panel.querySelector('.floating-merge');
    if (merge) merge.disabled = managedCount < 2;
}

function openMergePackDialog(ids) {
  const dialog = document.createElement('dialog');
  dialog.className = 'merge-pack-dialog';
  dialog.innerHTML = '<form class="merge-pack-form"><p class="eyebrow">PACK BUILDER</p><h2>Merge selected mods</h2><p>Choose a name for the new merged pack.</p><input id="merge-pack-name" class="merge-pack-input" type="text" maxlength="80" autocomplete="off" autofocus placeholder="Pack name"><div class="merge-pack-actions"><button type="button" class="action secondary" data-pack-cancel>Cancel</button><button type="submit" class="action">Merge mods</button></div></form>';
  document.body.appendChild(dialog);
  const input = dialog.querySelector('#merge-pack-name');
  const focusInput = () => { if (dialog.open) input?.focus({ preventScroll: true }); };
  dialog.showModal();
  dialog.querySelector('[data-pack-cancel]').onclick = () => dialog.close();
  focusInput();
  requestAnimationFrame(focusInput);
  setTimeout(focusInput, 40);
  dialog.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = dialog.querySelector('#merge-pack-name').value.trim();
    if (!name) return focusInput();
    showPackProgress({ state: 'processing', phase: 'Starting...', percent: 0 });
    try {
      state.data = await call('mod:merge', { ids, name });
      state.librarySelection.clear();
      dialog.close();
      renderLibrary();
      showPackProgress({ state: 'completed', phase: 'Pack created', percent: 100 });
      toast('Pack created.');
    } catch (error) { showPackProgress({ state: 'failed', phase: error.message }); toast(error.message); }
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => dialog.remove());
}

function showPackProgress(event) {
  let panel = document.querySelector('.pack-progress-panel');
  if (!panel) {
    panel = document.createElement('aside');
    panel.className = 'pack-progress-panel';
    panel.setAttribute('role', 'status');
    document.body.appendChild(panel);
  }
  const percent = Number.isFinite(Number(event.percent)) ? Math.max(0, Math.min(100, Number(event.percent))) : null;
  panel.innerHTML = `<strong>${event.state === 'failed' ? 'Pack creation failed' : event.state === 'completed' ? 'Pack created' : 'Creating pack'}</strong><span class="pack-progress-phase">${libraryEscape(event.phase || 'Working...')}</span>${percent === null ? '' : `<div class="pack-progress-track"><span style="width:${percent}%"></span></div><small>${Math.round(percent)}%</small>`}`;
  if (event.state === 'completed' || event.state === 'failed') setTimeout(() => panel.remove(), 3500);
}

const libraryBulkObserver = new MutationObserver(syncLibraryBulkUi);
libraryBulkObserver.observe(document.body, { childList: true, subtree: true });
syncLibraryBulkUi();
window.vanta.onDownloadProgress((event) => {
  if (event.state === 'processing' || event.state === 'completed' || event.state === 'failed') showPackProgress(event);
  if (event.state === 'processing' && event.phase) toast(event.phase);
});
