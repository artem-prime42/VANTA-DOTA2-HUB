document.querySelector('#window-minimize')?.addEventListener('click', () => window.vanta.window.minimize());
document.querySelector('#window-maximize')?.addEventListener('click', () => window.vanta.window.toggleFullscreen());
document.querySelector('#window-close')?.addEventListener('click', () => window.vanta.window.close());
