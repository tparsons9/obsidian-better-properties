# Maintenance workflow

## Checks

Run `npm run verify` before submitting changes. Run `npm run e2e` for runtime, internal API, UI, lifecycle, or bundler changes. Every E2E test uses an isolated temporary vault; never substitute a real vault for the fixture.

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

## Maintenance follow-ups

- Validate the pinned workflows on GitHub after the foundation is reviewed and pushed. Validate runtime behavior on the declared minimum Obsidian version and a native phone before making stronger compatibility claims.
- Replace remaining internal-API TypeScript suppressions with narrow typed adapters as those areas are maintained, and extend focused UI/data regression coverage beyond the initial core/schema gate.
- Repair the separate docs app's existing MDX declarations and `Env.GITHUB_PAT` typing so its full type check can become a blocking gate.

The nine scanner policy findings require a deliberate compatibility decision about scripting, CSS imports and declarative settings. Keep them documented separately from fixable CSS defects.
