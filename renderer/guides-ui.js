const GUIDE_CONTENT = [
  {
    id: 'install',
    title: { ru: 'Как устанавливать моды', en: 'How to install mods' },
    steps: {
      ru: ['Откройте вкладку «Моды» и выберите нужный раздел.', 'Найдите мод через поиск или откройте страницу героя.', 'Укажите путь к Dota 2 в Настройках, если игра не найдена автоматически.', 'Откройте карточку мода и нажмите «Установить». Менеджер скачает архив и разместит VPK в папке языка Dota 2.', 'Запустите Dota 2 с тем же языком, который выбран в настройках VANTA.', 'После установки мод появится в Библиотеке: его можно включить, отключить, удалить или объединить.'],
      en: ['Open Mods and choose a section.', 'Find a mod with search or open a hero page.', 'Set the Dota 2 path in Settings if the game was not detected automatically.', 'Open the mod card and click Install. The manager downloads the archive and places the VPK in the Dota 2 language folder.', 'Launch Dota 2 with the same language selected in VANTA.', 'After installation the mod appears in Library, where it can be enabled, disabled, removed, or merged.'],
    },
  },
  {
    id: 'workflow',
    title: { ru: 'Как работает менеджер', en: 'How the manager works' },
    steps: {
      ru: ['Каталог загружает описания, превью, ссылки и метаданные. Файлы устанавливаются только после нажатия «Установить».', 'Библиотека хранит манифест каждого установленного мода и список его файлов.', 'Обычный VPK получает свободное имя pakXX_dir.vpk.', 'При отключении файл временно переименовывается, а при включении возвращается к исходному имени.', 'Пак объединяет несколько VPK в один файл и сохраняет список модов внутри.', 'Если мод не работает, проверьте путь к игре, язык Dota 2 и конфликты файлов.'],
      en: ['The Catalog loads descriptions, previews, links, and metadata. Files are installed only after you click Install.', 'Library stores a manifest and file list for every installed mod.', 'A regular VPK receives a free pakXX_dir.vpk name.', 'When disabled, a file is temporarily renamed; when enabled, its original name is restored.', 'A pack combines several VPK files and stores its member list.', 'If a mod does not work, check the game path, Dota 2 language, and file conflicts.'],
    },
  },
  {
    id: 'matchmaking',
    title: { ru: 'Не пускает в поиск матча', en: 'Cannot enter matchmaking' },
    steps: {
      ru: ['Полностью закройте Dota 2. Steam можно оставить открытым.', 'На Windows скачайте FixMatchMaking.bat по ссылке ниже и запустите его от имени пользователя.', 'После выполнения скрипта снова проверьте поиск матча.', 'Если проблема осталась, перезапустите Steam, проверьте целостность файлов и временно отключите конфликтующие моды.', 'Важно: этот способ предназначен только для Windows.'],
      en: ['Fully close Dota 2. Steam can remain open.', 'On Windows download FixMatchMaking.bat using the link below and run it as your user.', 'After the script finishes, test matchmaking again.', 'If the issue remains, restart Steam, verify the game files, and temporarily disable conflicting mods.', 'Important: this workaround is for Windows only.'],
    },
    link: 'https://github.com/artem-prime42/dota2-mods/releases/download/295/FixMatchMaking.bat',
    linkLabel: { ru: 'Скачать FixMatchMaking.bat', en: 'Download FixMatchMaking.bat' },
  },
  {
    id: 'pack',
    title: { ru: 'Что такое пак', en: 'What is a pack' },
    steps: {
      ru: ['Пак — это один VPK-файл, внутри которого объединено несколько модов.', 'После объединения исходные записи заменяются одной записью пака, а состав сохраняется в Библиотеке.', 'Моды активного пака отмечаются установленными в Каталоге.'],
      en: ['A pack is one VPK file containing several merged mods.', 'After merging, the original records are replaced by one pack record while its contents remain in Library.', 'Mods from an active pack are marked as installed in the Catalog.'],
    },
  },
  {
    id: 'create-pack',
    title: { ru: 'Как создать пак', en: 'How to create a pack' },
    steps: {
      ru: ['Откройте Библиотеку и выберите минимум два мода.', 'Нажмите «Объединить моды», введите название и подтвердите создание.', 'Менеджер объединит VPK, назначит свободное имя pakXX_dir.vpk и сохранит состав пака.'],
      en: ['Open Library and select at least two mods.', 'Click Merge mods, enter a name, and confirm creation.', 'The manager merges the VPK files, assigns a free pakXX_dir.vpk name, and saves the pack contents.'],
    },
  },
  {
    id: 'save-pack',
    title: { ru: 'Как сохранить пак', en: 'How to save a pack' },
    steps: {
      ru: ['Найдите созданный пак в Библиотеке.', 'Сохраните его через управление паком, чтобы копия VPK и состав остались в хранилище VANTA.', 'Сохранённый пак останется доступен после перезапуска приложения.'],
      en: ['Find the created pack in Library.', 'Save it through pack management so the VPK copy and member list remain in VANTA storage.', 'The saved pack remains available after restarting the app.'],
    },
  },
  {
    id: 'restore-pack',
    title: { ru: 'Восстановление и активация', en: 'Restore and activate' },
    steps: {
      ru: ['Откройте сохранённые паки в Библиотеке.', 'Активируйте пак, чтобы восстановить отсутствующий VPK в папке языка Dota 2.', 'Для отключённого пака активация снова включит его файл.', 'При восстановлении назначается новое свободное имя, поэтому файлы не перезаписываются.'],
      en: ['Open saved packs in Library.', 'Activate a pack to restore its missing VPK to the Dota 2 language folder.', 'For a disabled pack, activation enables its file again.', 'Restoration uses a new free filename, so existing files are not overwritten.'],
    },
  },
  {
    id: 'manage-pack',
    title: { ru: 'Управление паком', en: 'Manage a pack' },
    steps: {
      ru: ['Просмотрите состав пака, чтобы увидеть входящие моды.', 'Переименуйте пак, если нужно изменить его название.', 'Удаление сохранённой копии не удаляет установленный VPK.', 'Чтобы полностью удалить установленный пак, используйте удаление в Библиотеке.'],
      en: ['View a pack contents to see its member mods.', 'Rename the pack when you need a different name.', 'Deleting a saved copy does not remove an installed VPK.', 'To remove an installed pack completely, use Remove in Library.'],
    },
  },
  {
    id: 'pack-catalog',
    title: { ru: 'Паки и каталог', en: 'Packs and the Catalog' },
    steps: {
      ru: ['Когда пак установлен и включён, моды из его состава получают отметку «Установлено».', 'После отключения или удаления пака отметки исчезают после обновления библиотеки.', 'Сохранённый, но не активированный пак не помечает моды установленными.'],
      en: ['When a pack is installed and enabled, its member mods receive an Installed mark.', 'After disabling or removing a pack, marks disappear after the library is refreshed.', 'A saved but inactive pack does not mark mods as installed.'],
    },
  },
  {
    id: 'priority-conflicts',
    title: { ru: 'Приоритет модов и конфликты', en: 'Mod priority and conflicts' },
    steps: {
      ru: ['Моды в Dota 2 работают через VPK/pak-файлы и их итоговый порядок в папке языка.', 'У каждого VPK есть номер pakXX, и этот номер влияет на порядок загрузки.', 'При конфликте файлов меньший номер имеет более высокий приоритет.', 'Если два мода меняют один и тот же ресурс, одновременно использовать две разные версии этого файла нельзя.', 'Мод с более высоким приоритетом перекрывает ресурс другого мода.', 'Поэтому перед установкой нескольких модов на одного героя сначала решите, какой мод должен быть поверх остальных.', 'Затем менеджер должен назначить этому моду более высокий приоритет/номер, чтобы его ресурс перекрывал ресурс другого мода.', 'Важно: приоритет определяется итоговым порядком pak-файлов, а не временем скачивания.', 'Пример: pak02 → мод, который пользователь хочет видеть поверх всего; pak03 → второй мод; pak04 → третий мод. Если два мода изменяют один и тот же ресурс, будет использоваться версия из пакета с более высоким приоритетом.', 'Пример для героя: вы ставите несколько модов на Invoker и хотите совместить модель одного мода с эффектами другого. Это возможно только если моды не конфликтуют по одним и тем же ресурсам. Если они заменяют один и тот же файл, один ресурс будет перекрывать другой.'],
      en: ['Mods in Dota 2 are loaded from VPK/pak files and the final order of those files in the game folder matters.', 'Each VPK has a pakXX number, and that number affects load order.', 'When two files conflict, the lower pak number has higher priority.', 'If two mods edit the same resource, you cannot use two different versions of that file at the same time.', 'The mod with higher priority overwrites the matching resource from another mod.', 'That is why, before installing several mods on one hero, decide which mod should stay on top.', 'Then the manager should assign that mod the higher priority number so its files win over the others.', 'Important: priority is determined by the final order of pak files, not by download time.', 'Example: pak02 → the mod the user wants to see on top; pak03 → second mod; pak04 → third mod. If two mods change the same resource, the version from the higher-priority package is used.', 'Example for one hero: you install several mods on Invoker and want to combine one model with another mod’s effects. This works only if the mods do not replace the same resources. If they do, one resource will overlap the other.'],
    },
  },
  {
    id: 'mod-not-working',
    title: { ru: 'Мод установлен, но не работает', en: 'Mod is installed but does not work' },
    steps: {
      ru: ['Проверьте, что мод действительно установлен и отмечен как активный в Библиотеке.', 'Убедитесь, что путь к Dota 2 выбран корректно и язык игры совпадает с языком, выбранным в VANTA.', 'Проверьте, не конфликтует ли мод с другим модом на том же герое или том же ресурсе.', 'Если после установки ничего не изменилось, попробуйте временно отключить другие моды и запустить игру заново.'],
      en: ['Check that the mod is actually installed and marked active in Library.', 'Make sure the Dota 2 path is correct and the game language matches the one selected in VANTA.', 'Check whether the mod conflicts with another mod on the same hero or same resource.', 'If nothing changed after installation, temporarily disable other mods and launch the game again.'],
    },
  },
  {
    id: 'works-partially',
    title: { ru: 'Мод работает только частично', en: 'The mod works only partially' },
    steps: {
      ru: ['Частичный результат обычно означает конфликт по ресурсам, а не поломку мода.', 'Проверьте, меняет ли этот мод тот же файл, что и другой мод на этом же герое.', 'Отключите один из конфликтующих модов и проверьте, что остаётся видимым.', 'Если нужная часть работает только после изменения приоритета, используйте настройку порядка паков.'],
      en: ['Partial results usually mean a resource conflict rather than a broken mod.', 'Check whether this mod edits the same file as another mod on the same hero.', 'Disable one of the conflicting mods and see which part remains visible.', 'If the desired effect appears only after changing pak priority, adjust the order of the pack files.'],
    },
  },
  {
    id: 'find-conflicting-mod',
    title: { ru: 'Как найти конфликтующий мод', en: 'How to find a conflicting mod' },
    steps: {
      ru: ['Отключите все моды на этом герое или категории.', 'Включайте их по одному, каждый раз запускайте Dota 2 и проверяйте результат.', 'Когда ситуация повторяется, вы нашли конфликтующий мод.', 'После этого оставьте один мод активным или поменяйте их приоритет.', 'Не забывайте, что конфликт не всегда означает ошибку менеджера — это нормальная ситуация при одинаковых ресурсах.'],
      en: ['Disable all mods for that hero or category.', 'Enable them one by one, relaunch Dota 2 each time, and check the result.', 'When the problem reappears, you found the conflicting mod.', 'Then keep only one of them active or change their priority order.', 'A conflict is not always a manager bug; it can simply mean that both mods edit the same resource.'],
    },
  },
  {
    id: 'multiple-mods-one-hero',
    title: { ru: 'Как правильно установить несколько модов на одного героя', en: 'How to install several mods on one hero correctly' },
    steps: {
      ru: ['Сначала решите, какие части вы хотите оставить приоритетными: модель, эффекты, звук, оружие и т. д.', 'Установите модули один за другим, но не добавляйте конфликтующие варианты без проверки.', 'Если два модифицируют один и тот же файл, оставьте только один активным или измените порядок паков.', 'Комбинировать разные части от разных модов можно, если они меняют разные ресурсы, а не одну и ту же модель/эффект.'],
      en: ['First decide which parts should stay on top: model, effects, sounds, weapon, and so on.', 'Install mods one by one and do not add conflicting variants without checking.', 'If two mods edit the same file, keep only one active or change the pak order.', 'You can combine different parts from different mods only when they change different resources, not the same model or effect.'],
    },
  },
  {
    id: 'temporary-disable',
    title: { ru: 'Как временно отключить мод', en: 'How to temporarily disable a mod' },
    steps: {
      ru: ['Откройте Библиотеку и найдите нужный установленный мод.', 'Используйте действие «Отключить» или аналогичную кнопку для мода.', 'После отключения VPK временно переносится из папки языка, и мод перестаёт применяться.', 'Чтобы вернуть мод обратно, включите его снова в той же библиотеке.'],
      en: ['Open Library and find the installed mod you want to pause.', 'Use the Disable action or the equivalent button for that mod.', 'After disabling it, the VPK is temporarily moved out of the game language folder and the mod stops applying.', 'To restore it, enable the mod again in the same Library view.'],
    },
  },
  {
    id: 'check-active-mod',
    title: { ru: 'Как проверить, какой мод сейчас активен', en: 'How to check which mod is active' },
    steps: {
      ru: ['Откройте Библиотеку и посмотрите состояние каждого установленного мода.', 'У активных модов стоит отметка включён/установлен, а у отключённых — отключён.', 'Если вы используете паки, проверьте состав пака и состояние каждого входящего мода.', 'Сравните это с тем, что видно в игре: если эффект не появился, стоит проверить приоритет или конфликт.'],
      en: ['Open Library and inspect the state of each installed mod.', 'Enabled mods are marked as active or installed, while disabled ones are clearly marked as off.', 'If you use packs, check the pack contents and the state of each included mod.', 'Compare this with what you see in-game: if the effect is missing, check priority or conflict.'],
    },
  },
  {
    id: 'why-one-mod-overrides-another',
    title: { ru: 'Почему один мод перекрывает другой', en: 'Why one mod overrides another' },
    steps: {
      ru: ['Когда два мода меняют один и тот же файл, Dota 2 использует только один вариант этого файла.', 'Мод с более высоким приоритетом загружается последним или в нужном порядке и становится видимым.', 'Поэтому результат в игре — не «смешение», а выбор одного варианта ресурса.', 'Эта логика нормальна и встречается почти всегда при сложных модах на одного героя.'],
      en: ['When two mods change the same file, Dota 2 uses only one version of that resource.', 'The mod with higher priority is loaded in the correct order and becomes the visible result.', 'That is why the game does not “merge” both textures or effects — it chooses one version of the resource.', 'This is normal and common when several mods affect the same hero.'],
    },
  },
];

function currentGuideLanguage() { return state.data?.settings?.appLanguage === 'ru' ? 'ru' : 'en'; }
function renderGuides() {
  const language = currentGuideLanguage();
  document.body.classList.add('guides-view');
  document.body.classList.remove('authors-view');
  const copy = language === 'ru' ? 'Практические инструкции по установке модов, управлению файлами и работе с паками.' : 'Practical instructions for installing mods, managing files, and working with packs.';
  const compatibilityTitle = language === 'ru' ? 'Важно о совместимости модов' : 'Important about mod compatibility';
  const compatibilityBody = language === 'ru' ? ['Не все моды можно комбинировать.', 'Два мода могут конфликтовать.', 'Конфликт не обязательно означает ошибку менеджера.', 'Если мод изменяет тот же ресурс, что и другой мод, нужно проверить их приоритет или отключить один из них.'] : ['Not all mods can be combined.', 'Two mods may conflict with each other.', 'A conflict does not necessarily mean the manager is broken.', 'If two mods change the same resource, check the priority or disable one of them.'];
  $('#page-title').textContent = language === 'ru' ? 'Гайды' : 'Guides';
  $('#content').innerHTML = `<div class="guides-page"><div class="guides-heading"><p class="eyebrow">VANTA KNOWLEDGE BASE</p><h2>${language === 'ru' ? 'Гайды' : 'Guides'}</h2><p>${copy}</p></div><article class="guide-card"><button class="guide-title" type="button"><span class="guide-chevron">›</span><span>${compatibilityTitle}</span></button><div class="guide-body"><ol>${compatibilityBody.map((step) => `<li>${step}</li>`).join('')}</ol></div></article>${GUIDE_CONTENT.map((guide) => `<article class="guide-card"><button class="guide-title" type="button"><span class="guide-chevron">›</span><span>${guide.title[language]}</span></button><div class="guide-body"><ol>${guide.steps[language].map((step) => `<li>${step}</li>`).join('')}</ol>${guide.link ? `<a class="guide-link" href="${guide.link}" target="_blank" rel="noreferrer">${guide.linkLabel[language]}</a>` : ''}</div></article>`).join('')}</div>`;
  document.querySelectorAll('.guide-title').forEach((button) => button.onclick = () => button.closest('.guide-card').classList.toggle('open'));
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('.nav-item[data-view="guides"]');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  state.view = 'guides';
  state.author = '';
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
  renderGuides();
}, true);
