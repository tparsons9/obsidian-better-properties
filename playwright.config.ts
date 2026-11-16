import { defineObsidianConfig } from "obsidian-plugin-dev-kit/e2e";

export default defineObsidianConfig({
	workers: 1,
	reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
});
