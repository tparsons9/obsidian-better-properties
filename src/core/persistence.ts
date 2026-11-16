/** Snapshot and serialize writes so a slower earlier save cannot overwrite a later one. */
export class SaveQueue<T> {
	private pending: Promise<void> = Promise.resolve();
	constructor(private write: (value: T) => Promise<void>) { }

	save(value: T): Promise<void> {
		const snapshot = structuredClone(value);
		const result = this.pending.then(() => this.write(snapshot));
		this.pending = result.catch(() => { });
		return result;
	}
}

export interface FileFailure { path: string; error: string }

/** A vault-wide edit is a sequence of atomic file edits, not a transaction. */
export const processFiles = async <T extends { path: string }>(
	files: readonly T[], edit: (file: T) => Promise<void>,
): Promise<FileFailure[]> => {
	const failures: FileFailure[] = [];
	for (const file of files) {
		try { await edit(file); }
		catch (error) { failures.push({ path: file.path, error: String(error) }); }
	}
	return failures;
};
