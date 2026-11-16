import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const arraySettingsSchema = v.optional(
	v.object({
		hideAddButton: v.optional(v.boolean()),
	})
) satisfies PropertyTypeSchema;
