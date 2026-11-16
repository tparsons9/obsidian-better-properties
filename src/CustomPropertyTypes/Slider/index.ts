import { text } from "~/i18next";
import {
	CustomPropertyType,
	CustomTypeKey,
} from "../types";
import { registerListeners } from "./registerListeners";
import { renderSettings } from "./renderSettings";
import { renderWidget } from "./renderWidget";

export const typeKey = "slider" satisfies CustomTypeKey;

export const sliderPropertyType: CustomPropertyType = {
	type: typeKey,
	name: () => text("customPropertyTypes.slider.name"),
	icon: "lucide-git-commit",
	validate: (v) => typeof v === "number",
	registerListeners,
	renderSettings,
	renderWidget,
};

export { sliderSettingsSchema } from "./schema";
