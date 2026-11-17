import type { NestedPaths } from "~/lib/utils";
import en from "./languages/en.json";
import { translate } from "./translate";

type EN = typeof en;
export const text = <T extends NestedPaths<EN>>(
	key: T,
	variables?: Record<string, string>
): string => {
	const value = key.split(".").reduce<unknown>((value, part) =>
		value && typeof value === "object" ? Reflect.get(value, part) : undefined, en);
	return translate("better-properties", key, typeof value === "string" ? value : key, variables, en);
};
