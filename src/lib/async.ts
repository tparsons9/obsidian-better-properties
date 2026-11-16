import { Notice } from "obsidian";

export const reportError = (error: unknown): void => {
	console.error(error);
	new Notice(`Better Properties: ${String(error)}`);
};

/** Bridge asynchronous work to Obsidian and DOM callbacks that expect void. */
export const asyncHandler = <Args extends unknown[]>(handler: (...args: Args) => unknown) =>
	(...args: Args): void => {
		try {
			const result = handler(...args);
			if (result instanceof Promise) void result.catch(reportError);
		}
		catch (error) { reportError(error); }
	};
