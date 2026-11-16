import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "numeric" satisfies CustomTypeKey;

export const numericPropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.numeric.name"),
	icon: "lucide-circle-percent",
	validate: (v) => typeof v === "number" || typeof v === "string",
	registerListeners,
	renderSettings,
	renderWidget,
};

export { numericSettingsSchema } from "./schema";
