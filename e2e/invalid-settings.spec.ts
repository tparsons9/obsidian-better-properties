import { createObsidianTest } from "obsidian-plugin-dev-kit/e2e";

const { test, expect } = createObsidianTest({
	seedVault: "e2e/vault",
	sweepAfterHours: false,
	data: { "better-properties": { propertyLabelWidth: "invalid", propertySettings: { preserve: { general: { icon: "star" } } } } },
});

test("retains invalid saved data until an explicit reset", async ({ win, vault }) => {
	const modal = win.locator(".modal").filter({ hasText: "Invalid plugin settings detected" });
	await expect(modal).toBeVisible();
	const before: unknown = JSON.parse(await vault.read(".obsidian/plugins/better-properties/data.json"));
	expect(before).toMatchObject({ propertyLabelWidth: "invalid", propertySettings: { preserve: { general: { icon: "star" } } } });
	await modal.getByRole("button", { name: "Reset settings", exact: true }).click();
	await expect.poll(async () => JSON.parse(await vault.read(".obsidian/plugins/better-properties/data.json")) as unknown)
		.toMatchObject({ confirmPropertyDelete: true, propertySettings: {} });
});
