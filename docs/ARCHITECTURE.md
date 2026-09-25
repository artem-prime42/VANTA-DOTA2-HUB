# VANTA Dota architecture

## Runtime dependency boundary

```text
renderer UI
  -> preload IPC bridge
    -> AppService (use cases)
      -> core models/search
      -> CatalogClient -> GitHub catalog
      -> DownloadManager -> remote archive
      -> ModManager -> Library VPK store and Dota 2 filesystem
      -> JsonStorage -> VANTA user data
      -> SteamDetector -> local Steam libraries
```

The legacy `dota2-mod-manager` directory is not imported, spawned, or read by this runtime. The external catalog is the only source of mod metadata. The app's database and cache are independent JSON files under Electron's user data directory.

## Reference findings

The reference client confirmed these behaviors that VANTA owns independently:

- Dota is detected from Steam library folders and validated through `game/dota/pak01_dir.vpk`.
- Catalog metadata is published from `dota2-mod-manager-catalog/catalog.json` under `mods.modsData`.
- Catalog entries use remote `preview` and release `file` URLs and commonly include `categoryId`, `hero`, `slot`, `tags`, author and timestamps.
- Installation targets the Dota `game/dota` tree and must preserve unrelated files.
- Heavy catalog, archive and filesystem operations belong in the main process, never in the renderer.

## Migration plan

1. Catalog and search: normalize the external payload into VANTA `Mod` records and cache the last valid response.
2. State: persist favorites, settings, installed records and manifests in VANTA JSON storage.
3. Files: download archives into VANTA's download cache, validate ZIP paths, extract only safe relative paths, and record every written file.
4. Existing users: add a future one-time importer that reads legacy metadata as input and writes VANTA manifests; no VANTA service will call legacy modules at runtime.
5. Advanced formats: add an isolated VPK worker/service after archive install parity is verified, with tests around package ownership and rollback.

## Functional parity checklist

- [x] Remote catalog, categories, search and lazy previews
- [x] Favorites and persisted local state
- [x] Steam/Dota auto-detection and manual path selection
- [x] Download progress, cancel signal and retry through the action again
- [x] ZIP install/update/uninstall with ownership manifests
- [x] Cached offline catalog and explicit error states
- [x] Unified pak02-pak99 Library allocator, VPK merge/build, Pack rebuild and import
- [x] Legacy installed VPK migration into the Library store
- [ ] Independent application updater