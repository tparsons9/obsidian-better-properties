import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "time" satisfies CustomTypeKey;

export const timePropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.time.name"),
	icon: "lucide-clock",
	validate: (v) => typeof v === "string",
	registerListeners,
	renderSettings,
	renderWidget,
};

export { timeSettingsSchema } from "./schema";
