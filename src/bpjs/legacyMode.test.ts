import { afterEach, describe, expect, it, vi } from "vitest";
import { registerLegacyBpjsMode } from "./legacyMode";

afterEach(() => vi.unstubAllGlobals());

const createHost = (initial: Record<string, unknown> = {}) => ({
	modes: initial,
	defineMode(name: string, mode: unknown) { this.modes[name] = mode; },
	getMode: vi.fn(() => "javascript mode"),
});

describe("legacy bpjs highlighting", () => {
	it("does not require CM5 to register the bpjs processors", () => {
		vi.stubGlobal("window", {});
		vi.stubGlobal("activeWindow", {});
		const cleanup = vi.fn();
		expect(() => registerLegacyBpjsMode(cleanup)).not.toThrow();
		expect(cleanup).not.toHaveBeenCalled();
	});

	it("also tolerates absent window globals", () => {
		vi.stubGlobal("window", undefined);
		vi.stubGlobal("activeWindow", undefined);
		expect(() => registerLegacyBpjsMode(vi.fn())).not.toThrow();
	});

	it("uses the shared main-window registry and restores an earlier mode", () => {
		const original = () => "earlier mode";
		const host = createHost({ bpjs: original });
		vi.stubGlobal("window", { CodeMirror: host });
		vi.stubGlobal("activeWindow", {});
		let cleanup = () => {};
		registerLegacyBpjsMode((callback) => { cleanup = callback; });
		const mode = host.modes.bpjs as (config: Record<string, unknown>) => unknown;
		expect(mode({ indentUnit: 2 })).toBe("javascript mode");
		expect(host.getMode).toHaveBeenCalledWith({ indentUnit: 2 }, "javascript");
		cleanup();
		expect(host.modes.bpjs).toBe(original);
	});

	it("can use the active host and removes only its own mode", () => {
		const host = createHost();
		vi.stubGlobal("window", {});
		vi.stubGlobal("activeWindow", { CodeMirror: host });
		let cleanup = () => {};
		registerLegacyBpjsMode((callback) => { cleanup = callback; });
		expect(host.modes.bpjs).toBeTypeOf("function");
		cleanup();
		expect(host.modes).not.toHaveProperty("bpjs");
		registerLegacyBpjsMode((callback) => { cleanup = callback; });
		host.modes.bpjs = "another plugin's replacement";
		cleanup();
		expect(host.modes.bpjs).toBe("another plugin's replacement");
	});

	it("tolerates hosts without an exposed mode registry", () => {
		vi.stubGlobal("window", { CodeMirror: { defineMode: vi.fn(), getMode: vi.fn() } });
		vi.stubGlobal("activeWindow", {});
		let cleanup = () => {};
		registerLegacyBpjsMode((callback) => { cleanup = callback; });
		expect(cleanup).not.toThrow();
	});
});
