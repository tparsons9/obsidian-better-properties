import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "relation" satisfies CustomTypeKey;

export const relationPropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.relation.name"),
	icon: "lucide-arrow-up-right",
	validate: (v) => Array.isArray(v),
	registerListeners,
	renderSettings,
	renderWidget,
};

export { relationSettingsSchema } from "./schema";
