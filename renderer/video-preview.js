const videoPreviewDialog = document.querySelector('#video-preview');
const closeVideoPreview = document.querySelector('#close-video-preview');
function setupVideoControls() {
  const video = document.querySelector('#video-preview video');
  const frame = video?.closest('.video-preview-frame');
  document.querySelector('#video-preview-content')?.classList.add('video-modal-content');
  if (!video || !frame) return;
  frame.classList.add('video-wrapper');
  if (frame.querySelector('.video-controls')) return;
  video.removeAttribute('controls');
  const controls = document.createElement('div');
  controls.className = 'video-controls';
  const play = document.createElement('button'); play.type = 'button'; play.className = 'video-control-button';
  const progress = document.createElement('input'); progress.type = 'range'; progress.min = '0'; progress.max = '100'; progress.value = '0'; progress.className = 'video-progress';
  const time = document.createElement('span'); time.className = 'video-time';
  const mute = document.createElement('button'); mute.type = 'button'; mute.className = 'video-control-button';
  const format = (value) => { if (!Number.isFinite(value)) return '00:00'; return `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}`; };
  const updatePlay = () => { play.textContent = video.paused ? '▶' : '❚❚'; play.setAttribute('aria-label', video.paused ? 'Play' : 'Pause'); };
  const updateMute = () => { mute.textContent = video.muted ? '🔇' : '🔊'; mute.setAttribute('aria-label', video.muted ? 'Unmute' : 'Mute'); };
  const updateTime = () => { const duration = Number.isFinite(video.duration) ? video.duration : 0; time.textContent = `${format(video.currentTime)} / ${format(duration)}`; progress.value = duration ? String(video.currentTime / duration * 100) : '0'; };
  play.onclick = () => video.paused ? video.play().catch(() => {}) : video.pause();
  mute.onclick = () => { video.muted = !video.muted; updateMute(); };
  progress.oninput = () => { if (Number.isFinite(video.duration)) video.currentTime = video.duration * Number(progress.value) / 100; };
  video.addEventListener('play', updatePlay); video.addEventListener('pause', updatePlay); video.addEventListener('timeupdate', updateTime); video.addEventListener('loadedmetadata', updateTime); video.addEventListener('volumechange', updateMute);
  updatePlay(); updateMute(); updateTime(); controls.append(play, progress, time, mute); frame.append(controls);
}
new MutationObserver(setupVideoControls).observe(document.querySelector('#video-preview-content'), { childList: true, subtree: true });
function addDetailsPreviewButton() {
  const content = document.querySelector('#details-content');
  const actions = content?.querySelector('.details-actions');
  const preview = content?.querySelector('.details-hero');
  if (!actions || !preview || !/\.(?:mp4|webm|ogg|mov)(?:[?#].*)?$/i.test(preview.src) || actions.querySelector('.details-preview-button')) return;
  const button = document.createElement('button');
  button.className = 'action secondary preview-action details-preview-button';
  button.textContent = state.data?.settings?.appLanguage === 'ru' ? 'Предпросмотр' : 'Preview';
  button.onclick = () => showPreview(preview.src, content.querySelector('h2')?.textContent || 'Mod preview');
  actions.prepend(button);
}
function placeDetailsPreviewButton() {
  addDetailsPreviewButton();
  const content = document.querySelector('#details-content');
  const actions = content?.querySelector('.details-actions');
  const button = content?.querySelector('.details-preview-button');
  if (actions && button && button.parentElement === actions) actions.parentElement.insertBefore(button, actions);
}
new MutationObserver(placeDetailsPreviewButton).observe(document.querySelector('#details-content'), { childList: true, subtree: true });
closeVideoPreview?.addEventListener('click', () => {
  const video = videoPreviewDialog?.querySelector('video');
  video?.pause();
  if (video) { video.currentTime = 0; video.removeAttribute('src'); video.replaceChildren(); video.load(); }
  videoPreviewDialog?.close();
});
videoPreviewDialog?.addEventListener('close', () => {
  const video = videoPreviewDialog.querySelector('video');
  if (video) { video.pause(); video.currentTime = 0; video.removeAttribute('src'); video.replaceChildren(); video.load(); }
  document.querySelector('#video-preview-content')?.replaceChildren();
});
videoPreviewDialog?.addEventListener('click', (event) => {
  if (event.target === videoPreviewDialog) videoPreviewDialog.close();
});
