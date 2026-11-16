import { defineConfig } from "obsidian-plugin-dev-kit";

export default defineConfig({
	build: {
		// Keep handwritten styles.css; vault builds copy it, but CSS-only changes are not watched.
		css: false,
		external: [
			"@codemirror/autocomplete", "@codemirror/collab", "@codemirror/commands",
			"@codemirror/language", "@codemirror/lint", "@codemirror/search",
			"@lezer/common", "@lezer/highlight", "@lezer/lr",
		],
	},
	release: { changelog: "changelog.md", defaultBranch: "main" },
});
