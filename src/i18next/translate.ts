type TranslationHost = Pick<Window["i18next"], "addResourceBundle" | "t">;

const registeredHosts = new WeakSet<TranslationHost>();

// i18next is a shared main-window dependency, not a focused-document resource.
const getHost = (): TranslationHost | undefined => {
	const mainWindow = typeof window === "undefined" ? undefined : window;
	return mainWindow?.i18next ?? (typeof activeWindow === "undefined" ? undefined : activeWindow.i18next);
};

export const translate = (
	namespace: string,
	key: string,
	fallback: string,
	variables?: Record<string, string>,
	resources?: Record<string, unknown>
): string => {
	const host = getHost();
	if (host) {
		if (resources && !registeredHosts.has(host)) {
			host.addResourceBundle("en", namespace, resources);
			registeredHosts.add(host);
		}
		return host.t(key, { ...variables, ns: namespace, defaultValue: fallback });
	}
	return fallback.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (placeholder: string, name: string) => variables?.[name] ?? placeholder);
};
