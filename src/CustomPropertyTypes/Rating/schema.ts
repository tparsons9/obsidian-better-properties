import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const ratingSettingsSchema = v.optional(
	v.object({
		icon: v.optional(v.string()),
		count: v.optional(v.number()),
	})
) satisfies PropertyTypeSchema;
