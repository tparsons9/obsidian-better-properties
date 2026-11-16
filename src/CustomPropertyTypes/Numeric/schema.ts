import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const numericSettingsSchema = v.optional(
	v.object({
		decimalPlaces: v.optional(v.number()),
	})
) satisfies PropertyTypeSchema;
