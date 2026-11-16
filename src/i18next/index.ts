import { NestedPaths } from "~/lib/utils";
import en from "./languages/en.json";

const ns = "better-properties";

// add language packs below

activeWindow.i18next.addResourceBundle("en", ns, en); // English

//////////////////

const fixedT = (key: string, variables?: Record<string, string>) => activeWindow.i18next.t(key, { ...variables, ns: ns });

type EN = typeof en;
export const text = <T extends NestedPaths<EN>>(
	key: T,
	variables?: Record<string, string>
): string => {
	return fixedT(key, variables);
};
