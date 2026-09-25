# VANTA Dota2 Hub

VANTA Dota2 Hub is an independent desktop application for discovering, installing, and organizing Dota 2 mods. It combines a community-maintained catalog with a local VPK library, saved mod packs, and Hero Grid management in one interface.

> **Unofficial community project.** VANTA is not affiliated with, endorsed by, or supported by Valve or Dota 2. Mods are third-party files. Review their source and compatibility before installing them.

## Why VANTA exists

Finding a mod is only one part of modding Dota 2. Players also need to understand what a mod changes, install it into the right game folder, keep track of which files they manage, and control the load order when multiple VPKs are installed. VANTA brings these workflows together while keeping the catalog, the game installation, and VANTA's own data separate.

VANTA is an independent implementation; it does not run or import the legacy `dota2-mod-manager` application. The catalog is maintained separately from this client. This separation makes the client easier to maintain and lets it display the last successfully cached catalog when the network is unavailable.

## Features

### Discover and install mods

- Browse catalog sections for heroes, the game world, interface content, effects, and other mods.
- Search and filter by category, hero, author, favorites, installation status, and available updates.
- Open image and video previews, view author information, and mark mods as favorites.
- Install, update, enable, disable, or uninstall catalog mods. Downloads report progress and can be canceled.
- Detect common Steam libraries automatically or select a Dota 2 game folder manually.
- Choose the Dota 2 language folder that should receive managed VPK files.

### Manage a local VPK library

- Keep managed VPK files in VANTA's own library and deploy them to Dota 2 as `pak02_dir.vpk` through `pak99_dir.vpk`.
- Reorder installed mods to control their VPK priority; VANTA updates the corresponding filenames and library records together.
- Import VPK files, combine installed mods into packs, inspect pack contents, and rebuild or rename packs.
- Save reusable pack copies and activate or remove them later.
- Find VPK files in the selected language folder that are not owned by VANTA. External files are shown separately and can be enabled, disabled, or removed.

### Manage Hero Grids

- Preview and apply the Hero Grid layouts bundled with the application, organized by Dota patch, role, and most-played or high-win-rate mode.
- Detect the relevant Steam user configuration, inspect existing user grids, and remove individual or all user grids.
- Disable VANTA's applied grid to restore the previous configuration. VANTA keeps backup and installation metadata when applying a grid.

### Other conveniences

- English and Russian interface translations, built-in guides, UI scale and game-language settings.
- Optional Discord Rich Presence and configurable automatic update checks.
- Cached catalog browsing while offline. Installing or updating a mod still needs network access to that mod's download source.

## Requirements

### Using VANTA

- Windows or Linux. Packaged targets are currently Windows x64 (NSIS installer) and Linux x64 (AppImage). macOS packaging is not configured.
- A Dota 2 installation is needed for detecting the game, installing mods, and applying Hero Grids. The app can be opened before the game path is configured.
- Internet access is needed for the latest catalog and mod downloads. Previously cached catalog data remains available offline.

### Developing VANTA

- Node.js 20 and npm. Node.js 20 is also used by the GitHub Actions workflows.
- A Linux desktop environment and the libraries required by Electron to run the desktop app.
- Build Windows releases on Windows when native dependencies need to be rebuilt for the Electron runtime. The Windows CI workflow builds on a Windows runner.

## Run from source

```sh
git clone https://github.com/artem-prime42/Vanta-Dota2-Hub.git
cd Vanta-Dota2-Hub
npm ci
npm start
```

On first launch, VANTA tries to find Dota 2 in the Steam libraries. If it cannot find the game, open **Settings**, choose the Dota 2 folder containing `dota/pak01_dir.vpk`, and select the language folder used by the game. You can change the game path and language folder later in Settings.

## Development and tests

```sh
npm run check
npm test
```

`npm run check` performs the configured JavaScript syntax checks. `npm test` runs the Node.js built-in test suite. These tests do not require the Electron window to open or Dota 2 to be installed.

## Build packages

Build artifacts are written to `dist/`. These commands build locally and do not publish a GitHub release.

| Target | Command | Output |
| --- | --- | --- |
| Windows x64 installer | `npm run build:win` | `dist/VANTA-Setup-<version>.exe` |
| Linux x64 AppImage | `npm run build:linux` | `dist/VANTA-<version>.AppImage` |
| Windows package smoke test from Linux | `npm run build:win:linux-smoke` | NSIS package without native dependency rebuild; not a release-quality Windows build |
| Local Windows and Linux smoke builds | `npm run build:local` | NSIS installer and AppImage; the Windows target may require Wine |

The Windows installer offers an optional desktop shortcut, creates a Start Menu shortcut and uninstaller, and preserves VANTA's per-user data when the application is removed.

## Updates and releases

Packaged builds use `electron-updater` with GitHub Releases as the update provider. When automatic checks are enabled, VANTA checks on startup and every six hours. Update downloads and restart actions are presented in the application. Automatic checking can be disabled in Settings.

To publish a platform release from a release environment, use `npm run release:win` or `npm run release:linux`. These commands publish artifacts and require a `GH_TOKEN` with permission to create releases in the configured GitHub repository. Do not use them for ordinary local builds. Non-publishing build commands generate updater metadata locally.

GitHub Actions runs the checks and build workflows on pushes to `main` and can also be started manually. The workflows install the locked dependencies, run the syntax check and tests, build the platform package, verify update metadata, and upload the package as a workflow artifact. The Windows workflow also checks the installer and uninstall lifecycle, including preservation of user data.

## Data sources and storage

- **Mod catalog:** [`dota2-mod-manager-catalog`](https://github.com/artem-prime42/dota2-mod-manager-catalog), fetched from its published `catalog.json`. Catalog metadata and author information are cached locally. Mod archives and previews are hosted at URLs supplied by the catalog; they are not bundled with VANTA.
- **Hero Grid layouts:** bundled JSON files under `src/data/hero-grids/`. The currently included layouts are for patch `7.41f`.
- **VANTA data:** settings, favorites, library state, saved packs, catalog cache, and downloaded archives are stored in Electron's per-user application data directory, separately from the Dota 2 installation.
- **Dota 2 files:** managed VPKs and Hero Grid configuration are placed in the selected game/Steam folders. Back up important game files and configurations before making changes.

VANTA records the files associated with managed library entries. Files it does not own are identified separately; VANTA does not silently claim them as managed mods.

## Project layout

```text
renderer/                  Electron UI, styles, and client-side behavior
src/main/                  Electron main process, startup, and IPC bridge
src/main/services/          Application use cases and update service
src/application/            Mod installation and library workflows
src/core/                   Domain normalization, hero data, and search
src/infrastructure/         Catalog, downloads, storage, Steam, VPK, and grid adapters
src/data/hero-grids/        Bundled Hero Grid data by patch
test/                       Node.js test suite
docs/                       Architecture notes
build/                      Installer assets and packaging configuration
```

The renderer communicates with the main process through a restricted preload/IPC bridge. Filesystem, Steam, archive, and VPK operations stay in the main process. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the dependency flow and design notes.

## Compatibility and safety

- Dota updates and third-party mods may change behavior or stop working. VANTA cannot guarantee mod compatibility or the safety, quality, or continued availability of third-party files.
- Mods may replace the same game resources. If they conflict, change their VPK order or disable one of them; VANTA cannot make two replacements of the same resource coexist.
- Close Dota 2 before changing game files or applying a Hero Grid, then restart the game to load changes.
- Install only files from sources you trust. Keep backups of important game files and Steam configurations.

## Contributing and license

Bug reports and feature requests can be filed in the [GitHub issue tracker](https://github.com/artem-prime42/Vanta-Dota2-Hub/issues). Include your operating system, VANTA version, Dota 2 language folder, reproduction steps, and relevant error messages. Do not include account credentials, access tokens, or other secrets.

There is currently no license file in this repository. Until a license is added, reuse and redistribution permissions are not specified; contact the maintainer before reusing the code.