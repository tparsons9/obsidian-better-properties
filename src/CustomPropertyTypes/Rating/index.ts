import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "rating" satisfies CustomTypeKey;

export const ratingPropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.rating.name"),
	icon: "lucide-star",
	validate: (v) => typeof v === "number",
	registerListeners,
	renderSettings,
	renderWidget,
};

export { ratingSettingsSchema } from "./schema";
