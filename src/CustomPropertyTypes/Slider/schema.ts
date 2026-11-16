import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const sliderSettingsSchema = v.optional(
	v.object({
		min: v.optional(v.number()),
		max: v.optional(v.number()),
		step: v.optional(v.number()),
		hideLimits: v.optional(v.boolean()),
	})
) satisfies PropertyTypeSchema;
