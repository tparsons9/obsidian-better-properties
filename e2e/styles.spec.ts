import type { App } from "obsidian";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

test.use({ seed: { files: {
	"Styles.md": `---
status: todo
emptyselect: ""
stars: 3
summary: |
  # Heading
  A **Markdown** property with a long line that should wrap within the property editor rather than overflow into the next pane.
nested:
  count: 2
  child:
    enabled: true
items:
  - first
  - second
---

Style regression fixture.
`,
	".obsidian/types.json": JSON.stringify({ types: {
		status: "better-properties:select", emptyselect: "better-properties:select",
		stars: "better-properties:rating", summary: "better-properties:markdown",
		nested: "better-properties:object", "nested.child": "better-properties:object",
		items: "better-properties:array",
	} }),
} } });

async function assertPropertyStyles(page: Page) {
	const nested = page.locator('[data-property-key="nested"]');
	await expect(nested).toHaveCSS("flex-direction", "column");
	await expect(nested.locator('[data-property-key="nested.child"]')).toHaveCSS("flex-direction", "column");
	await expect.poll(() => nested.evaluate((el) => getComputedStyle(el, "::before").content)).toBe('""');
	const markdown = page.locator('[data-property-key="summary"] > .metadata-property-value');
	await expect(markdown).toHaveClass(/better-properties-markdown-has-folds/);
	await expect(markdown).toHaveCSS("padding-left", "16px");
	await expect(markdown.locator(".cm-gutters:visible")).toHaveCount(0);
	const dimensions = await markdown.evaluate((el) => {
		const style = getComputedStyle(el);
		const content = el.querySelector(".cm-content")!;
		return {
			lineHeight: parseFloat(style.lineHeight), fontSize: parseFloat(style.fontSize),
			normal: parseFloat(style.getPropertyValue("--line-height-normal")),
			contentWidth: content.getBoundingClientRect().width, width: el.getBoundingClientRect().width,
			font: style.fontFamily, editorFont: getComputedStyle(el.querySelector(".cm-scroller")!).fontFamily,
		};
	});
	expect(dimensions.lineHeight).toBeCloseTo(dimensions.fontSize * dimensions.normal, 1);
	expect(dimensions.contentWidth).toBeGreaterThan(100);
	expect(dimensions.contentWidth).toBeLessThanOrEqual(dimensions.width);
	expect(dimensions.editorFont).toBe(dimensions.font);
	await expect(page.locator('[data-property-key="stars"] .better-properties-rating-container')).toHaveCSS("display", "flex");
	const empty = page.locator('[data-property-key="emptyselect"] .better-properties-select-container').first();
	await expect(empty).toHaveClass(/better-properties-select-empty/);
	expect((await empty.boundingBox())!.width).toBeGreaterThan(100);
	await expect(page.locator('[data-property-key="status"] .better-properties-select')).toHaveCSS("display", "flex");
	await expect(page.locator('[data-property-key="items"]')).toHaveCSS("flex-direction", "column");
	await expect(page.locator('[data-property-key="items.0"] .metadata-property-key-input')).toBeHidden();
}

for (const mobile of [false, true]) {
	test(`Markdown folds and empty selects follow edits and reload (${mobile ? "simulated mobile" : "desktop"})`, async ({ obsidian, win, vault }) => {
		if (mobile) await obsidian.mobile();
		await obsidian.collapseSidebars();
		await obsidian.openFile("Styles.md", { mode: "live" });
		await assertPropertyStyles(win);
		const markdown = win.locator('[data-property-key="summary"] > .metadata-property-value');
		await markdown.locator(".cm-content").fill("Plain Markdown");
		await expect(markdown).not.toHaveClass(/better-properties-markdown-has-folds/);
		await markdown.locator(".cm-content").blur();
		await expect.poll(() => vault.read("Styles.md")).toContain("summary: Plain Markdown");
		const status = win.locator('[data-property-key="status"] .better-properties-select-container').first();
		await status.getByRole("combobox").click();
		await win.locator(".menu-item").filter({ hasText: /^Remove$/ }).click();
		await expect(status).toHaveClass(/better-properties-select-empty/);
		await status.getByRole("combobox").click();
		await win.locator(".menu-item").filter({ hasText: /^done$/ }).click();
		await expect(status).not.toHaveClass(/better-properties-select-empty/);
		await expect.poll(() => vault.read("Styles.md")).toContain("status: done");
		await obsidian.reload();
		await obsidian.openFile("Styles.md", { mode: "live" });
		await expect(markdown.locator(".cm-content")).toContainText("Plain Markdown");
		await expect(markdown).not.toHaveClass(/better-properties-markdown-has-folds/);
		await expect(status.getByRole("combobox")).toHaveText("done");
	});
}

for (const mode of ["light", "dark"] as const) {
	test(`property styles in ${mode} theme and a popout`, async ({ obsidian, win, app }, testInfo) => {
		await obsidian.setTheme({ mode });
		await obsidian.collapseSidebars();
		await obsidian.openFile("Styles.md", { mode: "live" });
		const markdown = win.locator('[data-property-key="summary"] > .metadata-property-value');
		await expect(markdown.locator(".cm-content")).toContainText("Markdown");
		await obsidian.settle();
		await assertPropertyStyles(win);
		await win.screenshot({ path: testInfo.outputPath(`${mode}-main.png`) });
		const opened = app.waitForEvent("window");
		await obsidian.evaluate(async (app: App) => {
			const file = app.vault.getFileByPath("Styles.md");
			if (!file) throw new Error("Style fixture missing");
			await app.workspace.getLeaf("window").openFile(file);
		});
		const popup = await opened;
		await expect(popup.locator('[data-property-key="summary"] .cm-content')).toContainText("Markdown");
		await assertPropertyStyles(popup);
		await popup.screenshot({ path: testInfo.outputPath(`${mode}-popout.png`) });
		const key = popup.locator('[data-property-key="nested.child"] > .metadata-property-key');
		await key.hover();
		await key.locator(".better-properties-properties-property-collapse-indicator").click();
		await expect(popup.locator('[data-property-key="nested.child"] > .metadata-property-value')).toBeHidden();
		await expect(popup.locator('[data-property-key="nested.count"]')).toBeVisible();
		await key.locator(".better-properties-properties-property-collapse-indicator").click();
		await expect(popup.locator('[data-property-key="nested.child.enabled"]')).toBeVisible();
		await popup.close();
	});
}
