import { test, expect } from "./fixtures";
import type { App, MarkdownView } from "obsidian";
import type { AppWithInternals } from "obsidian-plugin-dev-kit/e2e";

test("renders legacy settings and preserves false and zero defaults", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	await expect(win.locator('[data-property-key="flag"] .checkbox-container')).toBeVisible();
	await expect(win.locator('[data-property-key="score"] .metadata-property-value input')).toBeVisible();
	await expect(win.locator('[data-property-key="details"] .metadata-property')).not.toHaveCount(0);
	await expect(win.locator('[data-property-key="choices"]')).toContainText("apple");
	await expect(win.locator('[data-property-key="dynamic"]')).toContainText("scripted");
	await expect.poll(() => vault.read("Properties.md")).toContain("flag: false");
	expect(await vault.read("Properties.md")).toContain("score: 0");
});

test("persists scalar and nested edits across reload", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	await win.locator('[data-property-key="flag"] .checkbox-container').click();
	const score = win.locator('[data-property-key="score"] .metadata-property-value input');
	await score.fill("7");
	await score.press("Tab");
	const nested = win.locator('[data-property-key="details.count"] .metadata-property-value input');
	await nested.fill("9");
	await nested.press("Tab");
	await expect.poll(() => vault.read("Properties.md")).toContain("flag: true");
	await expect.poll(() => vault.read("Properties.md")).toContain("score: 7");
	await expect.poll(() => vault.read("Properties.md")).toContain("count: 9");
	await obsidian.reload();
	await obsidian.openFile("Properties.md", { mode: "live" });
	await expect(win.locator('[data-property-key="score"] .metadata-property-value input')).toHaveValue("7");
	expect(await vault.read("Properties.md")).toContain("Keep this note body intact.");
});

test("saves settings before the settings tab closes", async ({ obsidian, vault }) => {
	const settings = await obsidian.openSettings("better-properties");
	const row = settings.locator(".setting-item").filter({ hasText: "Confirm delete property" });
	await row.locator(".checkbox-container").click();
	await expect.poll(async () => JSON.parse(await vault.read(".obsidian/plugins/better-properties/data.json")) as unknown)
		.toMatchObject({ confirmPropertyDelete: false });
});

test("restores native behavior through repeated disable and enable", async ({ obsidian, win }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	for (let cycle = 0; cycle < 3; cycle++) {
		await obsidian.evaluate(async (app: AppWithInternals) => { await app.plugins.disablePlugin("better-properties"); });
		expect(await obsidian.evaluate((app: App) => Object.keys(app.metadataTypeManager.registeredTypeWidgets).filter((key) => key.startsWith("better-properties:")))).toEqual([]);
		expect(await obsidian.evaluate((app: App) => {
			const view = app.workspace.getMostRecentLeaf()?.view as MarkdownView | undefined;
			return view?.metadataEditor ? "createMoreButtonEl" in Object.getPrototypeOf(view.metadataEditor) : false;
		})).toBe(false);
		expect(await win.evaluate(() => {
			const cm = activeWindow.CodeMirror as typeof activeWindow.CodeMirror & { modes?: Record<string, unknown> };
			return cm.modes?.bpjs === undefined;
		})).toBe(true);
		await obsidian.evaluate(async (app: AppWithInternals) => { await app.plugins.enablePlugin("better-properties"); });
		await expect(win.locator('[data-property-key="flag"] .checkbox-container')).toBeVisible();
		await expect(win.locator(".better-properties-label-width-resizer")).toHaveCount(1);
	}
});

test("renders scripting in reading view", async ({ obsidian, win }) => {
	await obsidian.openFile("Properties.md", { mode: "preview" });
	await expect(win.locator(".better-properties-bpjs-codeblock:visible")).toHaveText("Script works");
});

test("imports user JavaScript and CSS after bundling", async ({ obsidian, win }) => {
	await obsidian.openFile("Imports.md", { mode: "preview" });
	await expect(win.locator(".better-properties-bpjs-codeblock:visible")).toContainText("42:function");
	await expect.poll(() => win.locator(".better-properties-bpjs-codeblock:visible style").textContent()).toContain("fixture-import-test");
});

test("loads and edits in simulated mobile mode", async ({ obsidian, win, vault }) => {
	await obsidian.mobile();
	await obsidian.openFile("Properties.md", { mode: "live" });
	await win.locator('[data-property-key="flag"] .checkbox-container').click();
	await expect.poll(() => vault.read("Properties.md")).toContain("flag: true");
});

test("edits in a popout window", async ({ obsidian, app, vault }) => {
	const opened = app.waitForEvent("window");
	await obsidian.evaluate(async (app: App) => {
		const file = app.vault.getFileByPath("Properties.md");
		if (!file) throw new Error("Fixture note missing");
		await app.workspace.getLeaf("window").openFile(file);
	});
	const popup = await opened;
	await popup.locator('[data-property-key="flag"] .checkbox-container').click();
	await expect.poll(() => vault.read("Properties.md")).toContain("flag: true");
	await popup.close();
});

test("renames an array property through the command and removes it through the menu", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	await obsidian.runCommand("better-properties:rename-property");
	await win.locator(".prompt-input").fill("choices");
	await win.locator(".suggestion-item").filter({ hasText: "choices" }).click();
	const modal = win.locator(".modal").filter({ hasText: "Rename property" });
	await modal.locator('input[type="text"]').fill("renamedChoices");
	await modal.getByRole("button", { name: "Rename", exact: true }).click();
	await expect.poll(() => vault.read("Properties.md")).toContain("renamedChoices:");
	expect(await vault.read("Properties.md")).toContain("- apple");
	await win.locator('[data-property-key="renamedChoices" i] .metadata-property-icon').click();
	await win.locator(".menu-item").filter({ hasText: /^Delete/ }).click();
	await win.locator(".modal").getByRole("button", { name: "Delete", exact: true }).click();
	await expect.poll(() => vault.read("Properties.md")).not.toContain("renamedChoices:");
	expect(await vault.read("Properties.md")).toContain("Keep this note body intact.");
});

test("select options can be changed without losing other properties", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	await win.locator('[data-property-key="status"] [role="combobox"]').click();
	await win.locator(".menu-item").filter({ hasText: /^done$/ }).click();
	await expect.poll(() => vault.read("Properties.md")).toContain("status: done");
	await win.locator('[data-property-key="dynamic"] [role="combobox"]').click();
	await expect(win.locator(".menu-item").filter({ hasText: /^scripted$/ })).toBeVisible();
	await win.locator(".menu-item").filter({ hasText: /^scripted$/ }).click();
	await win.locator('[data-property-key="filedynamic"] [role="combobox"]').click();
	await expect(win.locator(".menu-item").filter({ hasText: /^file-option$/ })).toBeVisible();
	await win.locator(".menu-item").filter({ hasText: /^file-option$/ }).click();
	await win.locator('[data-property-key="choices"] [role="combobox"]').click();
	await win.locator(".menu-item").filter({ hasText: /^banana$/ }).click();
	await expect.poll(() => vault.read("Properties.md")).toContain("- banana");
	expect(await vault.read("Properties.md")).toContain("score: 0");
});
