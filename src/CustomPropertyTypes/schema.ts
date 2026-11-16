import { PropertySettings, PropertyTypeSchema } from "./types";
import * as v from "valibot";
import { selectSettingsSchema } from "./Select/schema";
import { toggleSettingsSchema } from "./Toggle/schema";
import { titleSettingsSchema } from "./Title/schema";
import { markdownSettingsSchema } from "./Markdown/schema";
import { createdSettingsSchema } from "./Created/schema";
import { objectSettingsSchema } from "./Object/schema";
import { colorSettingsSchema } from "./Color/schema";
import { ratingSettingsSchema } from "./Rating/schema";
import { dateCustomSettingsSchema } from "./DateCustom/schema";
import { sliderSettingsSchema } from "./Slider/schema";
import { timeSettingsSchema } from "./Time/schema";
import { multiSelectSettingsSchema } from "./MultiSelect/schema";
import { numericSettingsSchema } from "./Numeric/schema";
import { arraySettingsSchema } from "./Array/schema";
import { relationSettingsSchema } from "./Relation/schema";

type SettingsBase = v.ObjectSchema<
	Record<string, PropertyTypeSchema>,
	undefined
>;

// NOTE type key names must be all lowercase, otherwise they will fail to register
export const propertySettingsSchema = v.object({
	general: v.optional(
		v.object({
			icon: v.optional(v.string(), ""),
			hidden: v.optional(v.boolean(), false),
			defaultValue: v.optional(v.string()),
			// onloadScript: z.string(),
			alias: v.optional(v.string()),
			suggestions: v.optional(v.array(v.string())),
			collapsed: v.optional(v.boolean()),
		})
	),
	array: arraySettingsSchema,
	select: selectSettingsSchema,
	multiselect: multiSelectSettingsSchema,
	toggle: toggleSettingsSchema,
	title: titleSettingsSchema,
	markdown: markdownSettingsSchema,
	created: createdSettingsSchema,
	// modified: v.optional(v.object({})),
	object: objectSettingsSchema,
	color: colorSettingsSchema,
	rating: ratingSettingsSchema,
	relation: relationSettingsSchema,
	datecustom: dateCustomSettingsSchema,
	slider: sliderSettingsSchema,
	time: timeSettingsSchema,
	numeric: numericSettingsSchema,
}) satisfies SettingsBase;

export const getDefaultPropertySettings =
	(): ResolvedPropertySettings => {
		return Object.fromEntries(
			Object.entries(propertySettingsSchema.entries).map(([key, schema]) => [key, v.parse(schema, {})])
		) as ResolvedPropertySettings;
	};

export type ResolvedPropertySettings = { [K in keyof PropertySettings]-?: NonNullable<PropertySettings[K]> };
