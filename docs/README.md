# Better Properties Docs

This is the documentation website for my plugin [Better Properties](https://github.com/unxok/obsidian-better-properties)

Run its commands from this directory, independently of the plugin package:

```sh
npm ci
npm run test:styles
npm run build
```

`rehype-style-hooks.ts` adds classes to headings with permalink icons and links containing code at compile time. The stylesheets use those classes instead of relational selectors. Its focused tests also run directly with `node --test docs/rehype-style-hooks.test.ts` from the repository root (Node 26).

`npx --no-install tsc -b tsconfig.node.json` checks the Vite configuration, transform and tests. The full `npm run typecheck` currently has existing MDX module-declaration errors and an undeclared `Env.GITHUB_PAT`; these are separate docs maintenance work. Do not change the plugin's dependencies or lockfile to resolve docs app issues.
