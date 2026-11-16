import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const relationSettingsSchema = v.optional(
	v.object({
		relatedProperty: v.optional(v.string()),
	})
) satisfies PropertyTypeSchema;
