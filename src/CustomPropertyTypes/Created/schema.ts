import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const createdSettingsSchema = v.optional(
	v.object({
		format: v.optional(v.string()),
	})
) satisfies PropertyTypeSchema;
