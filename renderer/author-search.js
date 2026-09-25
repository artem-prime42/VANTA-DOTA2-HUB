function syncDirectoryViewClass() {
  document.body.classList.toggle('guides-view', state.view === 'guides');
  document.body.classList.toggle('authors-view', state.view === 'authors');
  document.body.classList.toggle('home-view', state.view === 'discover');
  document.body.classList.toggle('hero-view', state.view === 'mods' && state.section === 'heroes');
}

function filterAuthorCards() {
  const query = String(state.authorQuery || '').trim().toLocaleLowerCase();
  document.querySelectorAll('.author-card').forEach((card) => {
    const name = card.dataset.author || card.querySelector('strong')?.textContent || '';
    card.style.display = !query || name.toLocaleLowerCase().includes(query) ? '' : 'none';
  });
}

function addAuthorSearch() {
  const intro = document.querySelector('.authors-intro');
  if (!intro) return;
  intro.querySelector('.eyebrow')?.remove();
  intro.querySelector('h2')?.remove();
  if (intro.querySelector('.author-directory-search')) { filterAuthorCards(); return; }
  const ru = state.data?.settings?.appLanguage === 'ru';
  const label = document.createElement('label');
  label.className = 'author-directory-search';
  label.innerHTML = `<span>⌕</span><input type="search" placeholder="${ru ? 'Поиск авторов' : 'Search authors'}" aria-label="${ru ? 'Поиск авторов' : 'Search authors'}">`;
  intro.appendChild(label);
  const input = label.querySelector('input');
  input.value = state.authorQuery || '';
  input.oninput = () => {
    state.authorQuery = input.value.trim();
    filterAuthorCards();
  };
  filterAuthorCards();
}

const authorSearchObserver = new MutationObserver(() => { syncDirectoryViewClass(); addAuthorSearch(); });
authorSearchObserver.observe(document.body, { childList: true, subtree: true });
syncDirectoryViewClass();
