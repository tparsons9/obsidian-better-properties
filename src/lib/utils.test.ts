import { describe, expect, it, vi } from "vitest";
import { deleteProperty, renameProperty } from "./utils";
import type BetterProperties from "~/main";
import { getDefaultSettings } from "~/Plugin/schema";

const fixture = (failPath?: string) => {
	let failure = failPath;
	const notes: Record<string, Record<string, unknown>> = {
		"a.md": { Original: ["one", "two"], untouched: false },
		"b.md": { original: null, untouched: 0 },
	};
	const settings = getDefaultSettings();
	settings.propertySettings.original = { general: { icon: "star", hidden: false } };
	const updateSettings = vi.fn(async (update: (value: typeof settings) => typeof settings) => { update(settings); });
	const setType = vi.fn();
	const unsetType = vi.fn();
	const plugin = {
		settings, updateSettings,
		app: {
			vault: { getMarkdownFiles: () => Object.keys(notes).map((path) => ({ path })) },
			fileManager: {
				processFrontMatter: async (file: { path: string }, change: (fm: unknown) => void) => {
					await Promise.resolve();
					if (file.path === failure) throw new Error("write failed");
					change(notes[file.path]);
				}
			},
			metadataTypeManager: { getAssignedWidget: () => "better-properties:array", setType, unsetType },
		},
	} as unknown as BetterProperties;
	return { plugin, notes, settings, updateSettings, setType, unsetType, allowWrites: () => { failure = undefined; } };
};

describe("vault-wide property changes", () => {
	it("awaits edits, preserves value shapes, and moves configuration once", async () => {
		const f = fixture();
		await renameProperty({ plugin: f.plugin, property: "Original", newProperty: "Renamed" });
		expect(f.notes).toEqual({ "a.md": { Renamed: ["one", "two"], untouched: false }, "b.md": { Renamed: null, untouched: 0 } });
		expect(f.updateSettings).toHaveBeenCalledTimes(1);
		expect(f.settings.propertySettings.original).toBeUndefined();
		expect(f.settings.propertySettings.renamed.general?.icon).toBe("star");
		expect(f.setType).toHaveBeenCalledWith("Renamed", "better-properties:array");
	});
	it("retains configuration on partial failure and permits a retry", async () => {
		const f = fixture("b.md");
		await expect(renameProperty({ plugin: f.plugin, property: "Original", newProperty: "Renamed" })).rejects.toThrow("b.md");
		expect(f.notes["a.md"].Renamed).toEqual(["one", "two"]);
		expect(f.notes["b.md"]).toHaveProperty("original", null);
		expect(f.settings.propertySettings.original).toBeDefined();
		expect(f.updateSettings).not.toHaveBeenCalled();
		expect(f.setType).not.toHaveBeenCalled();
		f.allowWrites();
		await renameProperty({ plugin: f.plugin, property: "Original", newProperty: "Renamed" });
		expect(f.notes["b.md"]).toHaveProperty("Renamed", null);
		expect(f.settings.propertySettings.original).toBeUndefined();
		expect(f.updateSettings).toHaveBeenCalledTimes(1);
	});
	it("deletes note values and only the property's configuration", async () => {
		const f = fixture();
		await deleteProperty({ plugin: f.plugin, property: "Original" });
		expect(f.notes).toEqual({ "a.md": { untouched: false }, "b.md": { untouched: 0 } });
		expect(f.settings.propertySettings).toEqual({});
		expect(f.settings.confirmPropertyDelete).toBe(true);
		expect(f.updateSettings).toHaveBeenCalledTimes(1);
	});
	it("retains configuration on failed delete", async () => {
		const f = fixture("a.md");
		await expect(deleteProperty({ plugin: f.plugin, property: "Original" })).rejects.toThrow("a.md");
		expect(f.updateSettings).not.toHaveBeenCalled();
		expect(f.unsetType).not.toHaveBeenCalled();
	});
	it("does not unset case-only renames or identical names", async () => {
		const f = fixture();
		await renameProperty({ plugin: f.plugin, property: "Original", newProperty: "Original" });
		expect(f.updateSettings).not.toHaveBeenCalled();
		await renameProperty({ plugin: f.plugin, property: "Original", newProperty: "original" });
		expect(f.unsetType).not.toHaveBeenCalled();
	});
});
