# Maintenance workflow

## Checks

Run `npm run verify` before submitting changes. Run `npm run e2e` for runtime, internal API, UI, lifecycle, or bundler changes. Every E2E test uses an isolated temporary vault; never substitute a real vault for the fixture.

Use `npm run e2e -- <spec-or-options>` for targeted runs. Standard Playwright invocation and discovery, including `npx --no-install playwright test --list`, also work. The config selects a bootstrap that redirects only Obsidian's CLI socket into each temporary user-data directory before loading the installed app; separate `--user-data-dir` values alone do not isolate that socket. It preserves Electron's app path for renderer module resolution. A global setup/teardown check verifies that an existing normal CLI socket keeps its device/inode, alongside opdk's own setup. `OBSIDIAN_PATH` still selects the real installed `app.asar`. The bootstrap and socket check are typechecked tooling, excluded from the plugin runtime.

The shared fixture fails on renderer console errors captured in the main process from the creation of every web contents, including startup and popouts. Its one exact exclusion is opdk's trust script accessing localStorage on the initial originless page; app/plugin exceptions are retained. The separate invalid-settings scenario intentionally exercises startup error reporting. Record the Electron version as well as the Obsidian app version: opdk launches its pinned Electron package against the installed app resources, rather than the installed Obsidian executable.

Type checking includes runtime source, tests, E2E specs, and tooling. Unit tests run in Node with a small typed Obsidian boundary fake; use the real-app fixture for UI behavior. Add regression tests for data transformations and error paths. The initial coverage gate explicitly covers the extracted core and schemas, not all source. Expand the inclusion list as additional modules gain meaningful tests; do not lower the thresholds to hide gaps.

Property schemas live in each type's `schema.ts`, separate from UI imports. The existing type entrypoints re-export their schemas. Settings schemas and saved defaults are in `src/Plugin/schema.ts`. Maintain CSS in `src/styles/main.css`; root `styles.css` is generated and ignored, like `main.js`. Opdk builds and watches the CSS entry and its local imports. CSS-only edits synchronize into the explicit vault target without a TypeScript edit. Restart watch after changing opdk configuration.

Use stable scoped selectors, with rendered classes/attributes for parent state. Do not reference CodeMirror's generated base class: Obsidian's popout style copier excludes any stylesheet containing it. Check computed styles and actual screenshots in both the main window and popouts. Keep stylesheet source tracked for scanning and reproducible releases.

## Data and lifecycle rules

Keep the plugin ID, type IDs, settings keys, and frontmatter representation compatible. Title, Created, and Relation remain disabled.

Vault-wide operations await each atomic file edit. A partial failure may leave some notes updated: the error names the failed files, and shared configuration remains unchanged so the operation can be retried. Do not imply rollback across files. Preserve arrays, nulls, false, zero, unrelated properties, and note bodies.

Settings saves snapshot and serialize writes. Invalid saved data is retained until an explicit reset. Patches register with the plugin's runtime cleanup store so they are restored before views rebuild on unload. Registry cleanup must preserve another plugin's replacement. Document any new internal API assumptions.

## Community scanner policy

Run `npm run scan` to see the scanner's unmodified findings. It scans Git-tracked files, so new files must be staged before a complete report; use a disposable snapshot repository when preserving the main index matters.

The scanner is advisory during this foundation pass. Project ESLint remains blocking, with statement-level exceptions for intentional `eval` in Select, MultiSelect, and bpjs; bpjs's user CSS imports; and the imperative settings tab retained for Obsidian 1.9.14 compatibility. The lint configuration permits these exceptions only in their owning files. All other preset restrictions remain active.

Stylesheet findings in the plugin and separate documentation app have been resolved. The docs app adds heading/code-link classes during Markdown compilation; its dependencies and checks remain separate (see `docs/README.md`). TypeScript suppression advisories remain visible for internal API boundaries.

## Release procedure

CI and release workflows call opdk 0.4.0 at the same immutable commit as the installed package. Update the package, lockfile, and workflow pins together with `npx --no-install opdk kit upgrade <version>` on a clean branch. Dependabot excludes these coordinated pins.

The quick local metadata gate is `npm run release:check`. Before publishing, use a clean committed tree and run:

```sh
npm ci
npm run verify
npm run e2e
npm run release:check:full
```

The full check also validates API compatibility with `minAppVersion` and compares working-tree and committed-tree build bytes. It can fail while uncommitted changes differ from HEAD; do not bypass that check for a release.

Record changes under `## [Unreleased]` in `changelog.md`. For an explicitly intended release, `npx --no-install opdk release patch` checks, bumps versions, creates and pushes a tag, verifies the workflow's attested draft assets, publishes, and pushes the release commit. This foundation pass does not run it. Do not use `npm version` or the removed upstream tagging scripts.

The tag workflow creates a draft; the release command verifies and publishes it. GitHub Actions must be enabled and allowed to create releases/attestations in the fork. Branch CI performs lint and tests; the tag workflow checks and builds release assets.

Keep `isDesktopOnly: false` and the current 1.9.14 minimum. API checks and bundle checks cover declared compatibility; runtime test results must state the actual app version and distinguish simulated mobile from native-device testing.

## Foundation validation — 2026-11-16

- Fresh dependency installation into an empty temporary checkout: `npm ci --offline --no-audit` passed using the populated npm cache.
- `npm run verify` passed, including 47 unit tests. The explicitly scoped core/schema coverage was 100% across all four metrics; this is not whole-plugin coverage.
- All 11 real-app scenarios passed on Obsidian 1.15.1, including popouts, simulated mobile, invalid-settings recovery, scripting imports, and UI rename/delete.
- The full release check passed in a disposable committed snapshot of the working files. Bundles matched byte for byte and the API check found no usage newer than 1.9.14. The original branch and index were not committed or staged.
- The raw scanner reported 24 findings: nine restrictions against the documented statement-level exceptions and 15 stylesheet findings. Code and manifest checks passed; internal typing suppressions remain additional advisories.

GitHub workflows are configured but were not executed remotely. Obsidian 1.9.14 and native phones were not runtime-tested in this pass. No version bump, tag, push, or release was performed.

## CSS and confirmation maintenance validation — 2026-11-16

- CSS generation initially matched the handwritten stylesheet byte for byte. With an explicit temporary vault target and `VAULT_PLUGIN` removed, the opdk watcher synchronized a CSS-only edit and its restoration without changing JavaScript bytes.
- `npm run verify` passed with 47 unit tests and 100% coverage for the explicitly scoped core/schema modules.
- All 19 isolated E2E scenarios passed with `OBSIDIAN_VERSION=1.15.1`, including four confirmation regressions and four style scenarios. These check warning descriptions, persisted opt-outs, cancellation and confirmed actions; nested objects/arrays and collapse state; Markdown typography, fold state and edit persistence; empty-select transitions; light/dark themes; popouts; and simulated mobile.
- Reviewed screenshots from both themes in the main window and popouts. The popout regression exposed the old generated CodeMirror class reference that made Obsidian omit the entire plugin stylesheet. The CSS now uses a stable scoped scroller selector. The Markdown fixture also exposed the uninitialized temporary `TFile`; prototype resolution now uses the actual source note.
- Raw scanning reports zero CSS findings, down from 15, including the two docs app findings. The nine documented policy exceptions and internal typing advisories remain visible; raw scanning is still advisory.
- `npm run release:check:full` passed in a disposable committed snapshot of the final source. Working-tree and committed-tree JavaScript/CSS matched byte for byte; the API check found no usage newer than 1.9.14. The original branch was not committed.
- In the separate docs app, the production build, two style-transform tests, and configuration/transform type checks passed. A headless Chrome preview of the compiled CSS passed heading alignment, permalink hover and code/ordinary-link decoration checks in both themes. Full docs type checking still fails on MDX declarations and `Env.GITHUB_PAT`; a disposable baseline checkout produced identical diagnostics. Neither lockfile changed.

The runtime evidence remains Obsidian 1.15.1 with simulated mobile, not 1.9.14 or native-device testing. Remote workflows have not been run.

## Translation startup regression validation — 2026-11-17

- The foundation refactor in `658de96` changed translation access from `window.i18next` to `activeWindow.i18next`. Release `1.0.1` registered its English bundle during module evaluation without checking whether the active window exposed that internal global. A missing translator therefore prevented the plugin from loading at all. The local release bundle's SHA-256 matched the published asset's digest (`efa239d5759a41c1618d50c718def87440779fa2dbc77bf776170c9def9c758c`).
- A new unit regression reproduced the reported `addResourceBundle` exception before the fix. Translation access now checks the active and main windows lazily, preserves host translations when available, and falls back to bundled English with variable interpolation. Every native label used by the plugin has a typed fallback.
- `npm run verify` passed with 51 unit tests. Coverage now includes the translation boundary alongside the existing core/schema gate: 100% statements, lines and functions, and 98.36% branches across that explicit scope.
- All 21 isolated E2E scenarios passed on Obsidian 1.15.1. Two new scenarios reload the production bundle with i18next hidden from the active window or both plugin-facing windows, then exercise property rendering, settings, interpolated rename descriptions, cancellation and menus. The globals are shadowed only in the plugin module; Obsidian's own translator remains intact. The suite also covers popouts and simulated mobile, not native phones or Obsidian 1.9.14.
- `npm run release:check:full` passed in a disposable committed snapshot, including identical working-tree/committed-tree JavaScript and CSS and the 1.9.14 minimum API check. No version bump, tag, push or publication was performed; the original branch and index were preserved.

The user's failure was reported on 1.15.1 while installing through BRAT in the main window. The exact reason that session's active window lacked i18next remains unconfirmed; the earlier scenarios and static release gates did not cover its absence. The presence of another plugin in a stack trace alone does not establish that it caused the failure.

## CodeMirror startup and CLI isolation validation — 2026-11-17

- The same `658de96` refactor changed the shared CM5 mode registry from `window.CodeMirror` to `activeWindow.CodeMirror`. The follow-up startup failure occurred at `cm.modes` after the translation fix. Mode registration now prefers the shared main-window highlighter, falls back to the active host when needed, and safely omits optional CM5 highlighting when neither is exposed. bpjs processing/execution stays registered. Cleanup still restores prior modes and preserves subsequent replacements.
- Read-only CLI diagnostics in the user's running sandbox reported Obsidian/installer 1.15.1 and Electron 43.8.9. At inspection time the active and main windows were identical and both globals existed; this does not establish their values during the earlier UI enable attempt. The opdk test runtime is Electron 45.2.3. The observed debug-mode plugin-loader branch only strips source maps; it did not explain the missing globals.
- Inspection of the installed `obsidian.asar/main.js` found an unconditional CLI server using `~/.obsidian-cli.sock` on macOS, with unlink calls before binding and during quit. It is independent of the user-data path. The test bootstrap now redirects that exact bind/unlink path to the per-test user-data folder before loading Obsidian, preserving the installed app path with Electron's entry-loader setter. It does not change HOME, user notes, or the installed app. Windows/Linux path handling is present but has not been runtime-tested.
- The shared fixture now captures renderer errors from web-contents creation, covering startup and popouts as well as the test body. The combined regression scenarios enable with a note already open and hide i18next and CodeMirror together from the active window or both plugin-facing windows, then verify settings, menus, interpolation, cancellation and bpjs execution. This improves on the earlier UI-only assertions. The reported native history `RangeError` did not recur in these scenarios; its independent cause remains unconfirmed.
- `npm run verify` passed with 56 unit tests; the explicitly scoped gate now includes legacy mode ownership and reports 100% statements/lines/functions and 98.66% branches. All 21 E2E scenarios passed on Obsidian 1.15.1 / Electron 45.2.3, including simulated mobile and popouts. Native devices, Obsidian 1.9.14, the installed Electron runtime and the user's full plugin set remain outside this runtime evidence.
- Across the final complete suite the normal CLI socket kept inode `1590966067`. An unsandboxed `obsidian version` still returned `1.15.1 (installer 1.15.1)` after teardown without restarting the normal app. Command-sandbox access restrictions can independently produce the same CLI discovery error.
- The full release check passed in a disposable committed snapshot of these changes: production JavaScript/CSS matched the committed-tree builds byte for byte and the API check found nothing newer than 1.9.14. After validation, the unminified vault build was synced to the explicitly requested `sandbox/.obsidian/plugins/obsidian-better-properties` folder. No user-vault test scenarios, version bump, repository commit, tag, push or publication were performed.

The tested application is Obsidian, but its Electron launcher, startup timing, seed vault and plugin set differ from the user's running installation. Static release gates and a successful build do not test internal-global availability. Keep these limits explicit rather than treating the renderer version alone as equivalence.

## Independent-review cleanup validation — 2026-11-17

- Removed the custom subprocess runner and direct-invocation guard. Playwright config now selects the isolated bootstrap, and a standard global setup/teardown hook checks the shared socket alongside opdk's own setup. Worker config reloads retain the selected real app path.
- Translation now prefers the shared main-window host, with active-host and bundled-English fallbacks retained. The regression test relies on the shared startup/popout error monitor instead of duplicate listeners.
- `npm run verify` passed with 56 unit tests. All 21 E2E scenarios passed on Obsidian 1.15.1 / Electron 45.2.3, including popouts and simulated mobile. `npx --no-install playwright test --list` discovered all 21 tests without a custom runner.
- The normal CLI socket retained inode `1590966067` through setup and teardown, and `obsidian version` still worked afterward without restarting the normal app. Dependency pins and the lockfile were unchanged.

## Maintenance follow-ups

- Validate the pinned workflows on GitHub after the foundation is reviewed and pushed. Validate runtime behavior on the declared minimum Obsidian version and a native phone before making stronger compatibility claims.
- Replace remaining internal-API TypeScript suppressions with narrow typed adapters as those areas are maintained, and extend focused UI/data regression coverage beyond the initial core/schema gate.
- Repair the separate docs app's existing MDX declarations and `Env.GITHUB_PAT` typing so its full type check can become a blocking gate.

The nine scanner policy findings require a deliberate compatibility decision about scripting, CSS imports and declarative settings. Keep them documented separately from fixable CSS defects.
