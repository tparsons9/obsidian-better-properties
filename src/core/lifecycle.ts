/** Runs registered cleanups once, in reverse registration order. */
export class CleanupStore {
	private callbacks = new Set<() => void>();

	add(callback: () => void): () => void {
		this.callbacks.add(callback);
		return () => { this.callbacks.delete(callback); };
	}

	dispose(): void {
		const errors: unknown[] = [];
		const callbacks = [...this.callbacks].reverse();
		this.callbacks.clear();
		for (const callback of callbacks) {
			try { callback(); } catch (error) { errors.push(error); }
		}
		if (errors.length) throw new Error(`Cleanup failed: ${errors.map(String).join("; ")}`);
	}
}

/** Restore only a value that is still ours; another plugin may have replaced it. */
export const ownRegistryEntry = <T extends object, K extends keyof T>(registry: T, key: K, value: T[K]): (() => void) => {
	const previous = Object.getOwnPropertyDescriptor(registry, key);
	registry[key] = value;
	return () => {
		if (registry[key] !== value) return;
		if (previous === undefined) delete registry[key];
		else Object.defineProperty(registry, key, previous);
	};
};
