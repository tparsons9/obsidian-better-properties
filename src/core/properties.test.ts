import { describe, expect, it } from "vitest";
import { deleteFrontmatterProperty, findKey, findKeyValueByDotNotation, getTrueProperty, isEmptyProperty, isRecord, renameFrontmatterProperty, stringValue, updateNestedObject } from "./properties";

describe("property identity and values", () => {
	it.each([undefined, null, ""])("treats %s as empty", (value) => expect(isEmptyProperty(value)).toBe(true));
	it.each([false, 0, [], {}, "false"])("preserves %j", (value) => expect(isEmptyProperty(value)).toBe(false));
	it.each([[{}, true], [[], false], [null, false], ["x", false]])("recognizes records", (value, expected) => expect(isRecord(value)).toBe(expected));
	it("normalizes array indices without changing case", () => {
		expect(getTrueProperty("Items.12.Status")).toBe("Items.#.Status");
		expect(getTrueProperty("name.child")).toBe("name.child");
	});
	it("finds keys case-insensitively", () => {
		expect(findKey({ Title: 1 }, "TITLE")).toBe("Title");
		expect(findKey({}, "missing")).toBeNull();
	});
	it.each([null, undefined, false, 0, "text", ["a", "b"], { nested: true }])("renames %j without changing its shape", (value) => {
		const fm: Record<string, unknown> = { Original: value, unrelated: "keep" };
		renameFrontmatterProperty(fm, "original", "Renamed");
		expect(fm).toEqual({ Renamed: value, unrelated: "keep" });
		expect(fm.Renamed).toBe(value);
	});
	it("supports case-only renames and ignores identical or missing keys", () => {
		const fm = { Name: 1 };
		renameFrontmatterProperty(fm, "Name", "Name");
		renameFrontmatterProperty(fm, "missing", "other");
		expect(fm).toEqual({ Name: 1 });
		renameFrontmatterProperty(fm, "Name", "name");
		expect(fm).toEqual({ name: 1 });
	});
	it("deletes only the selected key", () => {
		const fm = { Keep: 1, Remove: false };
		deleteFrontmatterProperty(fm, "remove");
		deleteFrontmatterProperty(fm, "missing");
		expect(fm).toEqual({ Keep: 1 });
	});
	it("resolves nested keys, arrays, nulls, and absent paths", () => {
		const fm = { Parent: { Items: [{ Value: 0 }], Empty: null } };
		expect(findKeyValueByDotNotation("parent.items.0.value", fm)).toEqual({ key: "Value", value: 0 });
		expect(findKeyValueByDotNotation("parent.empty", fm).value).toBeNull();
		for (const path of ["missing", "parent.items.0.value.child", "parent.empty.child"]) {
			expect(findKeyValueByDotNotation(path, fm)).toEqual({ key: undefined, value: undefined });
		}
	});
	it("writes nested values without changing siblings or array shape", () => {
		const fm = { items: [{ value: false, keep: "yes" }], other: 1 };
		updateNestedObject(fm, "items.0.value", 0);
		expect(fm).toEqual({ items: [{ value: 0, keep: "yes" }], other: 1 });
		updateNestedObject(fm, "new.child", "created");
		expect(fm).toHaveProperty("new.child", "created");
	});
	it("replaces scalar parents and rejects malformed or prototype paths before mutation", () => {
		const fm = { parent: false };
		updateNestedObject(fm, "parent.child", 1);
		expect(fm).toEqual({ parent: { child: 1 } });
		expect(updateNestedObject(fm, ".child", 1)).toBe(fm);
		for (const path of ["__proto__.polluted", "parent.constructor.x", "prototype.x"]) {
			expect(() => updateNestedObject(fm, path, true)).toThrow("Invalid property path");
		}
		expect({}).not.toHaveProperty("polluted");
	});
	it("formats scripting results explicitly", () => {
		expect(stringValue(null)).toBe("");
		expect(stringValue(undefined)).toBe("");
		expect(stringValue(false)).toBe("false");
		expect(stringValue({ a: 1 })).toBe("[object Object]");
		expect(stringValue(() => 1)).toContain("=>");
	});
});
