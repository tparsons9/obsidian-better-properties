import { test, expect } from "./fixtures";
import type { AppWithInternals } from "obsidian-plugin-dev-kit/e2e";

for (const hideMainGlobals of [false, true]) {
	const scope = hideMainGlobals ? "both windows" : "the active window";
	test(`loads and renders settings, menus and bpjs without host globals in ${scope}`, async ({ obsidian, win, vault }) => {
		await obsidian.openFile("Properties.md", { mode: "live" });
		await obsidian.evaluate(async (app: AppWithInternals) => { await app.plugins.disablePlugin("better-properties"); });
		const bundlePath = ".obsidian/plugins/better-properties/main.js";
		const bundle = await vault.read(bundlePath);
		// Shadow shared host globals together, only in the plugin module scope.
		// Removing them from the actual window would break Obsidian itself.
		await vault.write(bundlePath, `(function(activeWindow, window) {
	${bundle}
	})(...[globalThis.activeWindow, globalThis.window].map((hostWindow, index) => index === 1 && !${hideMainGlobals} ? hostWindow : new Proxy(hostWindow, {
		get(target, key) {
			if (key === "i18next" || key === "CodeMirror") return undefined;
			return Reflect.get(target, key, target);
		}
	})));
	`);
		await obsidian.evaluate(async (app: AppWithInternals) => {
			await app.plugins.enablePlugin("better-properties");
			if (!app.plugins.plugins["better-properties"]) throw new Error("Plugin did not load without i18next");
		});
		await obsidian.openFile("Properties.md", { mode: "live" });
		await expect(win.locator('[data-property-key="flag"] .checkbox-container')).toBeVisible();
		const settings = await obsidian.openSettings("better-properties");
		await expect(settings).toContainText("Confirm delete property");
		await expect(settings.locator('[aria-label="Restore default settings"]').first()).toBeVisible();
		await obsidian.closeSettings();
		await obsidian.runCommand("better-properties:rename-property");
		await win.locator(".prompt-input").fill("choices");
		await win.locator(".suggestion-item").filter({ hasText: "choices" }).click();
		const modal = win.locator(".modal").filter({ hasText: "Rename property" });
		await expect(modal).toContainText('"choices"');
		await modal.getByRole("button", { name: "Cancel", exact: true }).click();
		await win.locator('[data-property-key="choices"] .metadata-property-icon').click();
		await expect(win.locator(".menu-item").filter({ hasText: /^Delete/ })).toBeVisible();
		await win.keyboard.press("Escape");
		await obsidian.openFile("Properties.md", { mode: "preview" });
		await expect(win.locator(".better-properties-bpjs-codeblock:visible")).toHaveText("Script works");
	});
}
