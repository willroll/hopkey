# Porting Leapp to Hopkey

Hopkey is the continuation of [Leapp](https://github.com/Noovolari/leapp) (Noovolari closed in May 2024). This page
tracks where the port stands: what changed, what the maintainers still have to do outside the code, and the known gaps.

## What changed

- **Name.** Everything is renamed by [tools/rebrand/rebrand.js](tools/rebrand/rebrand.js): npm packages
  (`@hopkey/core`, `@hopkey/cli`), the `hopkey` command, the `hopkey://` scheme, the app id `io.github.willroll.hopkey`,
  the `~/.hopkey` directory, the "Hopkey" keychain service and the IPC ids. The script never points links at domains
  the project doesn't own; `node tools/rebrand/rebrand.js --check` runs in CI and `--report` lists what intentionally
  still names Leapp. Re-run it after merging upstream changes; add `rebrand:keep` to a line that must keep a Leapp name.
- **Leapp users.** On first launch Hopkey imports the Leapp workspace, its plugins and its keychain secrets, and it loads
  plugins published for Leapp ([docs](docs/installation/migrating-from-leapp.md)).
- **No more Noovolari services.** No PostHog analytics, no Google Analytics on the docs, no update feed from
  asset.noovolari.com (updates come from this repository's releases), no Noovolari shutdown popup, no Font Awesome Pro
  kit (icons are bundled), no Noovolari Slack, S3, CloudFront or Homebrew tap in CI and scripts.
- **No Pro or Team.** Their code is removed: remote workspaces, the lock screen options, the Pro checkout and the
  `team`, `workspace` and `set-workspace` CLI commands. They needed Noovolari's servers.
- **Branding.** Leapp's and Noovolari's logos are replaced by a placeholder mark generated from
  [tools/brand](tools/brand) (`node tools/brand/generate-icons.js`, needs `rsvg-convert` and ImageMagick).
- **Fixed on the way.** The CLI could not run any command (inquirer 9 is ESM-only), the CLI lockfile was out of sync,
  and the CLI and desktop app test suites did not run (puppeteer 24, Angular 15).
- **CI.** [ci.yml](.github/workflows/ci.yml) lints and tests the three packages; [release.yml](.github/workflows/release.yml)
  publishes the desktop app to GitHub releases on `vX.Y.Z` tags, [npm-release.yml](.github/workflows/npm-release.yml)
  the packages on `core-vX.Y.Z` / `cli-vX.Y.Z` tags, and [docs.yml](.github/workflows/docs.yml) the docs to GitHub Pages.

Verified locally with Node 18.20.8: core 726 tests, CLI 336 tests, desktop app 51 tests, lint, a production build,
the Linux `.deb` and AppImage, the app launching, the import of a seeded Leapp workspace with its keychain secrets, and
the CLI talking to the running app. Windows and macOS packages have not been built yet.

## Maintainer to-do

These need the repository owner and can't be done from the code:

1. **Rename the repository** from `willroll/leapp` to `willroll/hopkey` (Settings → General). Links, the update check,
   the release workflow and the docs URL already use the new name.
2. **Enable GitHub Discussions**, where "Join the community" and the docs send users, and **GitHub Pages** from the
   `gh-pages` branch once the docs workflow has run.
3. **Register the `@hopkey` npm organization** (free on 2026-09-29) and add an `NPM_TOKEN` secret.
4. **Code signing** for release builds: `CSC_LINK`/`CSC_KEY_PASSWORD` plus `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`
   and `APPLE_TEAM_ID` for macOS, `WIN_CSC_LINK`/`WIN_CSC_KEY_PASSWORD` for Windows. Without them releases are unsigned.
5. **Contacts**: an address for Code of Conduct reports (`.github/CODE_OF_CONDUCT.md`) and a maintainer e-mail for the
   Linux packages (`build.linux.maintainer` in `packages/desktop-app/package.json`).
6. **Name checks**: a trademark search for "Hopkey" where you distribute it, and a final logo to replace the placeholder.

## Known gaps

- **Upstream assets still in use**: the multi-console browser extension (Firefox add-on and Chromium zip published by
  Noovolari), the [plugin template](https://github.com/Noovolari/leapp-plugin-template) and `@noovolari/dpapi-addon`.
  Fork them before they disappear. Plugin signature checks (disabled) still point at Noovolari's plugin service.
- **Docs** still show Leapp screenshots and GIFs; the CLI reference in `docs/cli` should be regenerated with the first
  CLI release.
- **Aging stack**: Node 18 and Electron 22 are out of support, and `keytar` is archived; plan the upgrades (Electron's
  `safeStorage` is a candidate replacement for `keytar`).
- The proxy settings in the options are saved (the password in the keychain) but no connection uses them: apply them
  or remove them.
