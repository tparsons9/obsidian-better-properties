import { describe, expect, it, vi } from "vitest";
import { CleanupStore, ownRegistryEntry } from "./lifecycle";

describe("cleanup", () => {
	it("forgets completed resources without retaining their cleanup", () => {
		const store = new CleanupStore();
		const cleanup = vi.fn();
		store.add(cleanup)();
		store.dispose();
		expect(cleanup).not.toHaveBeenCalled();
	});
	it("runs in reverse order once, including after a cleanup fails", () => {
		const store = new CleanupStore();
		const calls: number[] = [];
		store.add(() => { calls.push(1); });
		store.add(() => { calls.push(2); throw new Error("failed"); });
		store.add(() => { calls.push(3); });
		expect(() => store.dispose()).toThrow("failed");
		expect(calls).toEqual([3, 2, 1]);
		expect(() => store.dispose()).not.toThrow();
	});
	it("restores replaced entries and removes entries it added", () => {
		const registry: Record<string, string> = { native: "original" };
		const restore = ownRegistryEntry(registry, "native", "ours");
		restore();
		expect(registry.native).toBe("original");
		const remove = ownRegistryEntry(registry, "new", "ours");
		remove();
		expect(registry).not.toHaveProperty("new");
	});
	it("leaves a later plugin's replacement alone", () => {
		const registry = { method: vi.fn() };
		const cleanup = ownRegistryEntry(registry, "method", vi.fn());
		const replacement = vi.fn();
		registry.method = replacement;
		cleanup();
		expect(registry.method).toBe(replacement);
	});
});
