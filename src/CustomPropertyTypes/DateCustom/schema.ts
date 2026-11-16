import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const dateCustomSettingsSchema = v.optional(
	v.object({
		type: v.optional(v.union([v.literal("date"), v.literal("datetime-local")])),
		format: v.optional(v.string()),
		placeholder: v.optional(v.string()),
		icon: v.optional(v.string()),
	})
) satisfies PropertyTypeSchema;
