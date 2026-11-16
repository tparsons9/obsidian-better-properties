# Maintenance workflow

## Checks

Run `npm run verify` before submitting changes. Run `npm run e2e` for runtime, internal API, UI, lifecycle, or bundler changes. Every E2E test uses an isolated temporary vault; never substitute a real vault for the fixture.

Type checking includes runtime source, tests, E2E specs, and tooling. Unit tests run in Node with a small typed Obsidian boundary fake; use the real-app fixture for UI behavior. Add regression tests for data transformations and error paths. The initial coverage gate explicitly covers the extracted core and schemas, not all source. Expand the inclusion list as additional modules gain meaningful tests; do not lower the thresholds to hide gaps.

Property schemas live in each type's `schema.ts`, separate from UI imports. The existing type entrypoints re-export their schemas. Settings schemas and saved defaults are in `src/Plugin/schema.ts`. Root `styles.css` remains maintained source.

## Data and lifecycle rules

Keep the plugin ID, type IDs, settings keys, and frontmatter representation compatible. Title, Created, and Relation remain disabled.

Vault-wide operations await each atomic file edit. A partial failure may leave some notes updated: the error names the failed files, and shared configuration remains unchanged so the operation can be retried. Do not imply rollback across files. Preserve arrays, nulls, false, zero, unrelated properties, and note bodies.

Settings saves snapshot and serialize writes. Invalid saved data is retained until an explicit reset. Patches register with the plugin's runtime cleanup store so they are restored before views rebuild on unload. Registry cleanup must preserve another plugin's replacement. Document any new internal API assumptions.

## Community scanner policy

Run `npm run scan` to see the scanner's unmodified findings. It scans Git-tracked files, so new files must be staged before a complete report; use a disposable snapshot repository when preserving the main index matters.

The scanner is advisory during this foundation pass. Project ESLint remains blocking, with statement-level exceptions for intentional `eval` in Select, MultiSelect, and bpjs; bpjs's user CSS imports; and the imperative settings tab retained for Obsidian 1.9.14 compatibility. The lint configuration permits these exceptions only in their owning files. All other preset restrictions remain active.

Remaining stylesheet findings include `:has()` and `!important` in the plugin stylesheet and the separate documentation app. They are recorded debt, not a reason to change user scripting semantics or redesign the documentation site. TypeScript suppression advisories also remain visible for internal API boundaries.

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

## Maintenance follow-ups

- Adopt opdk CSS generation/watch: move the handwritten stylesheet to `src/styles/main.css`, generate root `styles.css`, update tracking/documentation, and verify that CSS-only edits reach a temporary vault. The current `css: false` preserves the original stylesheet but does not watch it.
- Fix confirmation dialogs: the delete dialog uses the title translation key for its body; delete/reset “Don't ask again” checkboxes currently assign the confirmation flag directly instead of inverting it. Add UI regressions for the warning text, confirmation preferences and cancellation.
- Clean up stylesheet findings and invalid declarations, including the stray `I` in the Markdown widget's `line-height`. Verify nested properties, Markdown widgets, selects, light/dark themes and popouts when changing selectors or specificity. The documentation app accounts for two of the 15 scanner CSS findings.
- Validate the pinned workflows on GitHub after the foundation is reviewed and pushed. Validate runtime behavior on the declared minimum Obsidian version and a native phone before making stronger compatibility claims.
- Replace remaining internal-API TypeScript suppressions with narrow typed adapters as those areas are maintained, and extend focused UI/data regression coverage beyond the initial core/schema gate.

The nine scanner policy findings require a deliberate compatibility decision about scripting, CSS imports and declarative settings. Keep them documented separately from fixable CSS defects.
