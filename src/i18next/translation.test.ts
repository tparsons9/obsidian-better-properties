import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
	vi.unstubAllGlobals();
	vi.resetModules();
});

describe("translation compatibility", () => {
	it("loads without Obsidian's internal translator and keeps readable labels", async () => {
		vi.stubGlobal("activeWindow", {});
		vi.stubGlobal("window", {});
		const { text } = await import("./index");
		const { obsidianText } = await import("./obsidian");
		expect(text("customPropertyTypes.toggle.name")).toBe("Toggle");
		expect(obsidianText("dialogue.button-cancel")).toBe("Cancel");
		expect(obsidianText("properties.label-type-mismatch-warning", { type: "Toggle" }))
			.toBe("Type mismatch, expected Toggle");
	});

	it("interpolates English without browser globals or treating values as markup", async () => {
		vi.stubGlobal("activeWindow", undefined);
		vi.stubGlobal("window", undefined);
		const { text } = await import("./index");
		expect(text("common.openFile", { fileName: "<note> $&" })).toBe('Open "<note> $&"');
		expect(text("common.openFile")).toBe('Open "{{fileName}}"');
		expect(text("common.openFile", { fileName: "" })).toBe('Open ""');
		expect(text("customPropertyTypes")).toBe("customPropertyTypes");
	});

	it("uses a translator that appears later and registers English only once", async () => {
		vi.stubGlobal("activeWindow", {});
		vi.stubGlobal("window", {});
		const { text } = await import("./index");
		const { obsidianText } = await import("./obsidian");
		expect(text("customPropertyTypes.toggle.name")).toBe("Toggle");
		const host = {
			addResourceBundle: vi.fn(),
			t: vi.fn((key: string, options: Record<string, string>) =>
				key === "dialogue.button-cancel" ? "Abbrechen" : options.defaultValue),
		};
		vi.stubGlobal("activeWindow", { i18next: host });
		expect(text("customPropertyTypes.toggle.name")).toBe("Toggle");
		expect(text("common.reset")).toBe("Reset");
		expect(host.addResourceBundle).toHaveBeenCalledExactlyOnceWith("en", "better-properties", expect.any(Object));
		expect(obsidianText("dialogue.button-cancel")).toBe("Abbrechen");
		expect(host.t).toHaveBeenLastCalledWith("dialogue.button-cancel", { ns: "default", defaultValue: "Cancel" });
		expect(host.addResourceBundle).toHaveBeenCalledTimes(1);
	});

	it("prefers the shared main translator and falls back to an active host when needed", async () => {
		const mainHost = { addResourceBundle: vi.fn(), t: vi.fn(() => "Basculer") };
		vi.stubGlobal("activeWindow", {});
		vi.stubGlobal("window", { i18next: mainHost });
		const { text } = await import("./index");
		expect(text("customPropertyTypes.toggle.name")).toBe("Basculer");
		const popoutHost = { addResourceBundle: vi.fn(), t: vi.fn(() => "Umschalten") };
		vi.stubGlobal("activeWindow", { i18next: popoutHost });
		expect(text("customPropertyTypes.toggle.name")).toBe("Basculer");
		expect(popoutHost.addResourceBundle).not.toHaveBeenCalled();
		vi.stubGlobal("window", {});
		expect(text("customPropertyTypes.toggle.name")).toBe("Umschalten");
		expect(mainHost.addResourceBundle).toHaveBeenCalledTimes(1);
		expect(popoutHost.addResourceBundle).toHaveBeenCalledTimes(1);
	});
});
