const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('author cards resolve mod counts instead of displaying the {count} placeholder', () => {
  const content = { innerHTML: '', classList: { toggle() {}, add() {}, remove() {} } };
  const document = {
    body: { classList: { toggle() {}, add() {}, remove() {} } },
    querySelector(selector) {
      if (selector === '#content') return content;
      if (selector === '#toast') return null;
      if (selector === '#page-title') return { textContent: '' };
      if (selector === '.topbar .search') return null;
      if (selector === '#details') return { showModal() {}, close() {} };
      if (selector === '#search') return { oninput: null, classList: { add() {}, remove() {} } };
      if (selector === '#refresh') return { classList: { add() {}, remove() {} }, onclick: null };
      if (selector === '#close-details') return { onclick: null };
      return null;
    },
    querySelectorAll() { return []; },
    createElement() {
      return { classList: { add() {}, remove() {}, toggle() {} }, append() {}, appendChild() {}, replaceChildren() {}, setAttribute() {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } };
    },
  };

  const context = {
    console,
    document,
    window: {
      vanta: {
        call: async () => ({
          ok: true,
          data: {
            gamePath: '',
            settings: { appLanguage: 'ru' },
            mods: [],
            categories: [],
            authors: [],
            installed: {},
            favorites: [],
            packs: [],
          },
        }),
        onDownloadProgress: () => {},
      },
    },
    setTimeout,
    clearTimeout,
    setInterval: () => 0,
    clearInterval: () => {},
    requestAnimationFrame: (fn) => fn(),
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../renderer/i18n.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../renderer/app.js'), 'utf8'), context);
  vm.runInContext(`
    state.data.settings = { appLanguage: 'ru' };
    state.data.authors = [{ name: 'Alice', count: 3, avatarUrl: '' }];
    state.view = 'authors';
    renderAuthors();
  `, context);

  assert.match(content.innerHTML, /3\s*мод/);
  assert.doesNotMatch(content.innerHTML, /\{count\}/);
});
