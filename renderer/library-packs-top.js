function movePacksToTop() {
  const content = document.querySelector('#content');
  const packs = content?.querySelector('.packs-section');
  const firstSection = content?.querySelector('.library-section');
  if (packs && firstSection && packs !== firstSection) content.insertBefore(packs, firstSection);
}
const packsTopObserver = new MutationObserver(movePacksToTop);
packsTopObserver.observe(document.body, { childList: true, subtree: true });
movePacksToTop();
