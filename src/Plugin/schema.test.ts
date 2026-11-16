import { describe, expect, it } from "vitest";
import * as v from "valibot";
import { betterPropertiesSettingsSchema, getDefaultSettings } from "./schema";
import { getDefaultPropertySettings } from "~/CustomPropertyTypes/schema";

describe("saved settings compatibility", () => {
	it("loads older partial settings with defaults", () => {
		const settings = v.parse(betterPropertiesSettingsSchema, {
			propertySettings: { status: { select: { manualOptions: [{ value: "todo" }] } } },
			confirmPropertyDelete: false, propertyLabelWidth: 0,
		});
		expect(settings.confirmPropertyDelete).toBe(false);
		expect(settings.propertyLabelWidth).toBe(0);
		expect(settings.confirmPropertySettingsReset).toBe(true);
		expect(settings.propertySettings.status.select?.optionsType).toBe("manual");
	});
	it("does not share mutable defaults between loads", () => {
		const first = getDefaultSettings();
		first.hiddenPropertyTypes.push("text");
		first.propertySettings.name = { general: { icon: "test", hidden: false } };
		expect(getDefaultSettings().hiddenPropertyTypes).toEqual([]);
		expect(getDefaultSettings().propertySettings).toEqual({});
	});
	it("populates all property defaults, including disabled legacy types", () => {
		const defaults = getDefaultPropertySettings();
		expect(defaults.general).toEqual({ icon: "", hidden: false });
		expect(defaults.select.optionsType).toBe("manual");
		expect(defaults.multiselect.optionsType).toBe("manual");
		for (const key of ["title", "created", "relation"] as const) expect(defaults[key]).toEqual({});
	});
	it.each([false, "bad", { propertyLabelWidth: "wide" }, { propertySettings: { x: { general: { hidden: "yes" } } } }])("rejects invalid settings without mutating input", (input) => {
		const snapshot = structuredClone(input);
		expect(v.safeParse(betterPropertiesSettingsSchema, input).success).toBe(false);
		expect(input).toEqual(snapshot);
	});
});
