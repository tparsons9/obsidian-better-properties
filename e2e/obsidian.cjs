// @ts-check
// Keep this as the Electron entry so isolation runs before any Obsidian code.
require("./isolate-cli.cjs");
const { app } = require("electron");
/** @type {string[]} */
const rendererErrors = [];
Object.defineProperty(app, "betterPropertiesTestErrors", { value: rendererErrors });
app.on("web-contents-created", (_event, contents) => {
	contents.on("console-message", (details) => {
		// opdk's trust init script touches storage on the initial about:blank page.
		// Ignore only that exact pre-origin failure, never app/plugin exceptions.
		const trustBootstrap = details.sourceId === "" && details.message === "Uncaught SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.";
		if (details.level === "error" && !trustBootstrap) rendererErrors.push(`${details.message} (${details.sourceId}:${details.lineNumber})`);
	});
});
const appAsar = process.env.BETTER_PROPERTIES_APP_ASAR;
if (!appAsar) throw new Error("Set OBSIDIAN_PATH to the installed Obsidian app.asar in the Playwright config.");
// Electron's internal entry loader uses this setter too. Updating its backing
// app path preserves renderer require() paths, including @electron/remote.
const setAppPath = Reflect.get(app, "setAppPath");
if (typeof setAppPath !== "function") throw new Error("Electron cannot preserve Obsidian's app path.");
setAppPath.call(app, appAsar);
process.argv[1] = appAsar;
require(appAsar);
