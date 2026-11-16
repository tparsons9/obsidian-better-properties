import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const toggleSettingsSchema = v.optional(
	v.object({})
) satisfies PropertyTypeSchema;
