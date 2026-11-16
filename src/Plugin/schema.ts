import * as v from "valibot";
import type { Prettify } from "~/lib/utils";
import { propertySettingsSchema } from "~/CustomPropertyTypes/schema";

export const betterPropertiesSettingsSchema = v.object({
	propertySettings: v.optional(
		v.record(v.string(), propertySettingsSchema),
		() => ({})
	),
	confirmPropertySettingsReset: v.optional(v.boolean(), true),
	confirmPropertyDelete: v.optional(v.boolean(), true),
	propertyLabelWidth: v.optional(v.number(), undefined),
	defaultLabelWidth: v.optional(v.string(), "9em"), // not UI facing
	hiddenPropertyTypes: v.optional(v.array(v.string()), () => [] as string[]),
});

export type BetterPropertiesSettings = Prettify<
	v.InferOutput<typeof betterPropertiesSettingsSchema>
>;

export const getDefaultSettings = (): BetterPropertiesSettings =>
	v.parse(betterPropertiesSettingsSchema, {});
