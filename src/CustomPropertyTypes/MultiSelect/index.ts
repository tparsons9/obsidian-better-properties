import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "multiselect" satisfies CustomTypeKey;

export const multiSelectPropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.multiSelect.name"),
	icon: "lucide-list-collapse",
	validate: (v) => Array.isArray(v),
	registerListeners,
	renderSettings,
	renderWidget,
};

export { multiSelectSettingsSchema } from "./schema";
