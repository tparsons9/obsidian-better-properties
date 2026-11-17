# Repository guidance

## Project and compatibility

This is Tanner Parsons's maintenance fork of Unxok's Better Properties Obsidian
plugin. Preserve upstream attribution, the MIT license, and existing local work.

Treat plugin ID `better-properties`, `better-properties:` type IDs, saved settings,
note frontmatter and bpjs scripting as compatibility surfaces. Changes require
explicit migration design. Keep desktop/mobile support and the declared minimum
Obsidian version unless the task calls for changing them. Title, Created and
Relation implementations exist but remain disabled in the registry.

## Source map

- `src/Plugin/plugin.ts`: lifecycle, commands and persistence.
  `schema.ts` contains pure settings validation; `settings.ts` contains the UI.
- `src/CustomPropertyTypes/`: widgets, per-type schemas and settings UIs; shared
  registration and helpers live at the directory root.
- `src/core/`: pure property transformations, save ordering, file processing and
  cleanup ownership. Keep these modules independent of app initialization.
- `src/MetadataEditor/`, `src/MetadataTypeManager/`, `src/MetadataCache/`:
  internal Obsidian adapters and patches.
- `src/bpjs/`: scripting and Markdown/CodeMirror processors.
- `src/classes/`: shared UI. `src/lib/types/`: supplemental Obsidian declarations.
- `src/i18next/`: typed translation helpers and English plugin text.
- `e2e/`: real-app regression tests and a synthetic seed vault.
- `docs/`: a separate documentation app with its own package and lockfile.
  Keep its dependency/build work separate from plugin changes.

## Development and validation

Use the versions declared in `.nvmrc` and `package.json`, and preserve the npm
lockfile. See `README.md` for commands and `CONTRIBUTING.md` for check policy,
release procedure, dated validation evidence and maintenance follow-ups.

Run `npm run verify` for code changes. Also run `npm run e2e` for runtime, UI,
internal API, lifecycle or bundler changes. Tests use opdk's temporary vault and
separate user-data directory; never launch a real user vault as a test. Use an
explicit target for vault builds and do not bypass plugin-ID protection.

`main.js` and root `styles.css` are generated and ignored. Edit
`src/styles/main.css`; opdk builds it and watches CSS-only edits and local imports
when syncing into an explicit temporary vault. Keep the source tracked so the
raw scanner sees it. Avoid CodeMirror's generated base class in the stylesheet:
Obsidian excludes stylesheets containing it from popout copying. Use stable,
scoped selectors and verify computed styles in both documents.

The unit coverage gate covers explicitly listed core/schema modules, not all UI.
Expand coverage with meaningful regression tests. Helpers and tests are
typechecked; helpers are also linted. Use real Obsidian for internal UI behavior.

Use the appropriate opdk marketplace skill for build, scanner, unit, E2E, demo or
release work, and the installed kit's docs for exact options. Dependency,
lockfile and reusable workflow pins must name the same kit release.

Raw `npm run scan` remains advisory. Project lint is blocking, with narrowly
documented exceptions for existing scripting, CSS imports and legacy-compatible
settings UI. Preserve scanner visibility; a passing verify does not mean the
community scorecard is clean. Do not change user scripting semantics merely to
silence eval warnings.

## Implementation rules

Follow surrounding TypeScript style: tabs, double quotes, semicolons and `~/`
imports. Prefer focused edits. Keep per-type schemas separate from UI imports;
active types register in `getCustomPropertyTypesArr()`, with lowercase type keys.

Preserve Valibot defaults and legacy settings. Keep invalid saved data until an
explicit reset. Snapshot and serialize settings writes, persisting UI changes
as they occur.

Vault-wide edits await individual file writes. On partial failure, retain shared
configuration and report failed paths; some notes may already have changed.
Preserve arrays, nulls, false, zero, unrelated frontmatter and note bodies.

Prefer public APIs; localize internal declarations and adapters. Register runtime
patches with `registerRuntime()` so restoration precedes view rebuilds on unload.
Remove only owned registry entries, preserving other plugins' replacements.
Use each element's own document/window for DOM operations. Keep Node tooling out
of the plugin runtime.

## Delivery

Record actual Obsidian test versions and distinguish simulated mobile from
native-device testing. Add changes under `[Unreleased]` in `changelog.md`.
Full release validation compares working-tree and committed-tree build bytes;
use a disposable committed snapshot when preserving the user's branch/index.
Do not run version bumps, tags, pushes or publishing as validation steps.

## Documentation sources

When a task needs current OpenAI API, ChatGPT, Codex, or plugin documentation,
use the official OpenAI developer documentation MCP server and cite the relevant
page.
