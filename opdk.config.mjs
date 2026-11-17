import { defineConfig } from "obsidian-plugin-dev-kit";

export default defineConfig({
	build: {
		css: { entry: "src/styles/main.css", outfile: "styles.css" },
		external: [
			"@codemirror/autocomplete", "@codemirror/collab", "@codemirror/commands",
			"@codemirror/language", "@codemirror/lint", "@codemirror/search",
			"@lezer/common", "@lezer/highlight", "@lezer/lr",
		],
	},
	release: { changelog: "changelog.md", defaultBranch: "main" },
});
