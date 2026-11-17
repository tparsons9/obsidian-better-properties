import { defineObsidianConfig } from "obsidian-plugin-dev-kit/e2e";
import { resolve } from "node:path";

const bootstrap = resolve(__dirname, "e2e/obsidian.cjs");
// Playwright reads this config again in workers, which inherit the wrapper path.
const configuredApp = process.env.OBSIDIAN_PATH === bootstrap
	? process.env.BETTER_PROPERTIES_APP_ASAR : process.env.OBSIDIAN_PATH;
const appAsar = configuredApp || (process.platform === "darwin" ? "/Applications/Obsidian.app/Contents/Resources/app.asar" : undefined);
if (appAsar) process.env.BETTER_PROPERTIES_APP_ASAR = resolve(appAsar);
process.env.OBSIDIAN_PATH = bootstrap;

export default defineObsidianConfig({
	workers: 1,
	globalSetup: "./e2e/cli-socket.ts",
	reporter: [["list"], ["html", { open: "never" }], ["json", { outputFile: "test-results/results.json" }]],
});
