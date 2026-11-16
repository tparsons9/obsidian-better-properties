import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "toggle" satisfies CustomTypeKey;

export const togglePropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.toggle.name"),
	icon: "lucide-toggle-left",
	validate: (v) => typeof v === "boolean",
	registerListeners,
	renderSettings,
	renderWidget,
};

export { toggleSettingsSchema } from "./schema";
