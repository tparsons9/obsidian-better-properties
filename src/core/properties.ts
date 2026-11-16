export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const stringValue = (value: unknown): string => {
	if (value === null || value === undefined) return "";
	// Keep the existing property/bpjs toString contract, including arrays and custom objects.
	return (value as { toString(): string }).toString();
};

export const isEmptyProperty = (value: unknown): boolean =>
	value === undefined || value === null || value === "";

/** Numeric array positions share one settings key. */
export const getTrueProperty = (property: string): string => property
	.split(".")
	.map((part) => Number.isNaN(Number(part)) ? part : "#")
	.join(".");

export const findKey = (obj: Record<string, unknown>, key: string): string | null =>
	Object.keys(obj).find((candidate) => candidate.toLowerCase() === key.toLowerCase()) ?? null;

export const renameFrontmatterProperty = (
	frontmatter: Record<string, unknown>, property: string, newProperty: string,
): void => {
	const key = findKey(frontmatter, property);
	if (key === null || key === newProperty) return;
	const value = frontmatter[key];
	delete frontmatter[key];
	frontmatter[newProperty] = value;
};

export const deleteFrontmatterProperty = (frontmatter: Record<string, unknown>, property: string): void => {
	const key = findKey(frontmatter, property);
	if (key !== null) delete frontmatter[key];
};

export const findKeyValueByDotNotation = (key: string, obj: Record<string, unknown>): {
	key: string | undefined; value: unknown;
} => {
	let current: unknown = obj;
	let found: string | undefined;
	for (const part of key.toLowerCase().split(".")) {
		if (current === null || typeof current !== "object") return { key: undefined, value: undefined };
		const record = current as Record<string, unknown>;
		found = Object.keys(record).find((candidate) => candidate.toLowerCase() === part);
		if (found === undefined) return { key: undefined, value: undefined };
		current = record[found];
	}
	return { key: found, value: current };
};

export const updateNestedObject = (obj: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> => {
	const keys = key.split(".");
	if (keys.some((part) => part === "")) return obj;
	if (keys.some((part) => ["__proto__", "constructor", "prototype"].includes(part))) {
		throw new Error("Invalid property path");
	}
	let current = obj;
	for (const part of keys.slice(0, -1)) {
		if (!Object.hasOwn(current, part) || current[part] === null || typeof current[part] !== "object") current[part] = {};
		current = current[part] as Record<string, unknown>;
	}
	current[keys[keys.length - 1]] = value;
	return obj;
};
