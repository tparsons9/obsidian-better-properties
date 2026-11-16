import { describe, expect, it, vi } from "vitest";
import { processFiles, SaveQueue } from "./persistence";

describe("settings writes", () => {
	it("snapshots changes and serializes writes", async () => {
		const writes: { value: number }[] = [];
		let finish: (() => void) | undefined;
		const blocked = new Promise<void>((resolve) => { finish = resolve; });
		const save = new SaveQueue(async (value: { value: number }) => {
			writes.push(value);
			if (writes.length === 1) await blocked;
		});
		const settings = { value: 1 };
		const first = save.save(settings);
		settings.value = 2;
		const second = save.save(settings);
		await Promise.resolve();
		expect(writes).toEqual([{ value: 1 }]);
		finish!();
		await Promise.all([first, second]);
		expect(writes).toEqual([{ value: 1 }, { value: 2 }]);
	});
	it("reports a failed write and permits the next save", async () => {
		const write = vi.fn<(value: number) => Promise<void>>().mockRejectedValueOnce(new Error("disk full")).mockResolvedValue(undefined);
		const save = new SaveQueue(write);
		await expect(save.save(1)).rejects.toThrow("disk full");
		await expect(save.save(2)).resolves.toBeUndefined();
		expect(write).toHaveBeenNthCalledWith(2, 2);
	});
});

describe("vault edits", () => {
	it("awaits each file and collects failures while continuing", async () => {
		const calls: string[] = [];
		const failures = await processFiles([{ path: "a" }, { path: "b" }, { path: "c" }], async ({ path }) => {
			calls.push(path);
			await Promise.resolve();
			if (path === "b") throw new Error("read only");
			calls.push(`${path}:done`);
		});
		expect(calls).toEqual(["a", "a:done", "b", "c", "c:done"]);
		expect(failures).toEqual([{ path: "b", error: "Error: read only" }]);
	});
	it("completes an empty vault without writes", async () => {
		const edit = vi.fn();
		expect(await processFiles([], edit)).toEqual([]);
		expect(edit).not.toHaveBeenCalled();
	});
});
