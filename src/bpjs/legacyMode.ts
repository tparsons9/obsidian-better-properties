type LegacyCodeMirror = {
	modes?: Record<string, unknown>;
	defineMode(name: string, factory: (config: Record<string, unknown>) => unknown): void;
	getMode(config: Record<string, unknown>, name: string): unknown;
};

export const registerLegacyBpjsMode = (registerCleanup: (cleanup: () => void) => unknown): void => {
	// This is Obsidian's shared CM5 highlighter, not the editor in the focused
	// document. Some windows/hosts do not expose it; bpjs execution needs no CM5.
	const mainWindow = typeof window === "undefined" ? undefined : window;
	const activeHost = typeof activeWindow === "undefined" ? undefined : activeWindow.CodeMirror;
	const cm = (mainWindow?.CodeMirror ?? activeHost) as LegacyCodeMirror | undefined;
	if (!cm) return;
	const name = "bpjs";
	const previous = cm.modes?.[name];
	cm.defineMode(name, (config) => cm.getMode(config, "javascript"));
	const owned = cm.modes?.[name];
	registerCleanup(() => {
		if (!cm.modes || cm.modes[name] !== owned) return;
		if (previous === undefined) delete cm.modes[name];
		else cm.modes[name] = previous;
	});
};
