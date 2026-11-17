import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import type { VaultHandle } from "obsidian-plugin-dev-kit/e2e";

type SavedSettings = { propertySettings: Record<string, unknown> };

const settingsPath = ".obsidian/plugins/better-properties/data.json";

async function savedSettings(vault: VaultHandle): Promise<SavedSettings | null> {
	try {
		return JSON.parse(await vault.read(settingsPath)) as SavedSettings;
	} catch (error) {
		// The adapter can be observed between truncation and completion of a write.
		if (error instanceof SyntaxError) return null;
		throw error;
	}
}

async function savedPropertyAbsent(vault: VaultHandle, property: string) {
	const settings = await savedSettings(vault);
	return settings !== null && settings.propertySettings[property] === undefined;
}

async function propertyAction(win: Page, property: string, action: string) {
	await win.locator(`[data-property-key="${property}"] > .metadata-property-key .metadata-property-icon`).click();
	await win.locator(".menu-item").filter({ hasText: new RegExp(`^${action}$`) }).click();
}

async function resetAction(win: Page) {
	await propertyAction(win, "status", "Settings");
	const settings = win.locator(".modal.mod-sidebar-layout");
	await settings.locator(".vertical-tab-nav-item").filter({ hasText: /^Actions$/ }).click();
	await settings.locator(".setting-item").filter({ hasText: "Completely wipe all settings for this property." }).getByRole("button").click();
}

test("delete warning, cancellation and confirmation preserve the right data", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	const before = await vault.read("Properties.md");
	await propertyAction(win, "status", "Delete");
	const modal = win.locator(".modal");
	await expect(modal.locator(".modal-content")).toHaveText('This action will permanently remove the property "status" from all notes, delete property configurations in this plugin\'s settings, and cannot be undone.');
	const checkbox = modal.getByRole("checkbox", { name: "Don't ask again" });
	await expect(checkbox).not.toBeChecked();
	await checkbox.check();
	await expect.poll(async () => await savedSettings(vault)).toMatchObject({ confirmPropertyDelete: false });
	await checkbox.uncheck();
	await expect.poll(async () => await savedSettings(vault)).toMatchObject({ confirmPropertyDelete: true });
	await modal.getByRole("button", { name: "Cancel", exact: true }).click();
	expect(await vault.read("Properties.md")).toBe(before);
	expect(await savedSettings(vault)).toMatchObject({ propertySettings: { status: { select: { manualOptions: [{ value: "todo" }, { value: "done" }] } } } });
	await propertyAction(win, "status", "Delete");
	await modal.getByRole("button", { name: "Delete", exact: true }).click();
	await expect.poll(() => vault.read("Properties.md")).not.toContain("status:");
	await expect.poll(async () => await savedPropertyAbsent(vault, "status")).toBe(true);
	expect(await vault.read("Properties.md")).toContain("score: 0");
	expect(await vault.read("Properties.md")).toContain("Keep this note body intact.");
});

test("delete opt-out persists on cancellation and bypasses confirmation after reload", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	const before = await vault.read("Properties.md");
	await propertyAction(win, "status", "Delete");
	await win.getByRole("checkbox", { name: "Don't ask again" }).check();
	await expect.poll(async () => await savedSettings(vault)).toMatchObject({ confirmPropertyDelete: false });
	await win.getByRole("button", { name: "Cancel", exact: true }).click();
	expect(await vault.read("Properties.md")).toBe(before);
	await obsidian.reload();
	await obsidian.openFile("Properties.md", { mode: "live" });
	await propertyAction(win, "status", "Delete");
	await expect.poll(() => vault.read("Properties.md")).not.toContain("status:");
	await expect(win.locator(".modal")).toHaveCount(0);
});

test("reset warning, cancellation and confirmation preserve notes and unrelated settings", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	const before = await vault.read("Properties.md");
	await resetAction(win);
	const modal = win.locator(".modal").filter({ has: win.locator(".modal-button-container") });
	await expect(modal.locator(".modal-content")).toHaveText("This will reset this property's settings which cannot be undone");
	const checkbox = modal.getByRole("checkbox", { name: "Don't ask again" });
	await expect(checkbox).not.toBeChecked();
	await checkbox.check();
	await expect.poll(async () => await savedSettings(vault)).toMatchObject({ confirmPropertySettingsReset: false });
	await checkbox.uncheck();
	await expect.poll(async () => await savedSettings(vault)).toMatchObject({ confirmPropertySettingsReset: true });
	await modal.getByRole("button", { name: "Cancel", exact: true }).click();
	expect(await savedSettings(vault)).toMatchObject({ propertySettings: { status: { select: { manualOptions: [{ value: "todo" }, { value: "done" }] } } } });
	const settings = win.locator(".modal.mod-sidebar-layout");
	await settings.locator(".setting-item").filter({ hasText: "Completely wipe all settings for this property." }).getByRole("button").click();
	await modal.getByRole("button", { name: "Reset", exact: true }).click();
	await expect.poll(async () => await savedPropertyAbsent(vault, "status")).toBe(true);
	expect(await savedSettings(vault)).toMatchObject({ propertySettings: { flag: { general: { defaultValue: "true" } } } });
	expect(await vault.read("Properties.md")).toBe(before);
});

test("reset opt-out persists on cancellation and resets directly after reload", async ({ obsidian, win, vault }) => {
	await obsidian.openFile("Properties.md", { mode: "live" });
	const before = await vault.read("Properties.md");
	await resetAction(win);
	await win.getByRole("checkbox", { name: "Don't ask again" }).check();
	await expect.poll(async () => await savedSettings(vault)).toMatchObject({ confirmPropertySettingsReset: false });
	await win.getByRole("button", { name: "Cancel", exact: true }).click();
	await win.keyboard.press("Escape");
	await expect(win.locator(".modal")).toHaveCount(0);
	await obsidian.reload();
	await obsidian.openFile("Properties.md", { mode: "live" });
	await resetAction(win);
	await expect.poll(async () => await savedPropertyAbsent(vault, "status")).toBe(true);
	await expect(win.getByRole("checkbox", { name: "Don't ask again" })).toHaveCount(0);
	expect(await vault.read("Properties.md")).toBe(before);
});
