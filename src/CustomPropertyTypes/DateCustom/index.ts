import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "datecustom" satisfies CustomTypeKey;

export const dateCustomPropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.datecustom.name"),
	icon: "lucide-calendar-plus",
	validate: (_v) => true, // TODO do we need to validate here?
	registerListeners,
	renderSettings,
	renderWidget,
};

export { dateCustomSettingsSchema } from "./schema";
