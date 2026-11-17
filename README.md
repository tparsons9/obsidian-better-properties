# Better Properties

Tanner Parsons's maintenance fork of [Unxok's Better Properties](https://github.com/unxok/obsidian-better-properties), an Obsidian plugin that adds property types, per-property settings, nested properties, and `bpjs` scripting.

The plugin keeps the ID `better-properties`, existing settings and frontmatter formats, and the declared minimum Obsidian version of 1.9.14. Desktop and mobile support remain enabled. Historical feature documentation lives in [docs/](docs/) and [README.old.md](README.old.md).

## Development

Use Node **26.13.1** (`.nvmrc`) and npm **11.20.0**. These are development requirements; the plugin runs inside Obsidian.

```sh
npm ci
npm run verify
```

`verify` runs type checking, lint, unit tests with coverage, the production build and bundle check, and release metadata checks. Generated `main.js` and `styles.css` ship with `manifest.json`.

To build/watch into a development vault, provide its plugin directory explicitly:

```sh
npm run build:vault -- /absolute/path/to/test-vault/.obsidian/plugins/better-properties
npm run dev -- /absolute/path/to/test-vault/.obsidian/plugins/better-properties
```

`VAULT_PLUGIN` is also supported by opdk. Check its value before relying on it. Do not override plugin-ID mismatch protection with `--force`.

Edit `src/styles/main.css`. Opdk generates the ignored root `styles.css` during builds and watches CSS-only changes and local CSS imports in vault watch mode. Keep the source tracked; the scanner checks it. Restart the watcher after changing `opdk.config.mjs`.

## Tests

```sh
npm test
node node_modules/electron/install.js
npm run e2e
```

Unit tests cover settings compatibility, nested values, property rename/delete, partial write failures, save ordering, and cleanup ownership. Coverage thresholds apply to the explicitly listed schemas and core modules in `vitest.config.mts`: 90% lines/statements/functions and 80% branches. They do not measure the entire UI.

E2E tests launch real Obsidian through opdk with a temporary vault and separate user-data directory. On macOS the fixture uses `/Applications/Obsidian.app/Contents/Resources/app.asar`; set `OBSIDIAN_PATH` for another installation. `OBSIDIAN_VERSION=x.y.z` enforces a particular installed version; the fixture does not download Obsidian versions. Traces, screenshots, and videos are retained on failure in `test-results/`.

The suite covers edits and reload persistence, settings persistence, delete/reset confirmations and opt-outs, scripting, plugin unload/reload, light/dark property styling, popouts, and simulated mobile mode. Simulated mobile testing does not replace testing on a native phone. E2E runs locally on macOS; Linux CI runs the static/unit/build gates.

## Maintenance checks

`npm run scan` produces the raw community-scanner report. CI uploads it as an advisory artifact. Its remaining findings cover intentional scripting/CSS imports and legacy settings UI; stylesheet findings are resolved. See [CONTRIBUTING.md](CONTRIBUTING.md) for the policy and release procedure. A green `verify` is not a claim of a clean community scorecard.

The production build reports esbuild's direct-eval warnings for existing user-authored scripting features. Those warnings remain visible; regression tests exercise scripting after bundling.

## Attribution

Originally authored by Unxok; maintained in this fork by Tanner Parsons. Distributed under the [MIT license](LICENSE).
