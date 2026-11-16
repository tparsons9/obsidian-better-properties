import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const colorSettingsSchema = v.optional(
	v.object({})
) satisfies PropertyTypeSchema;
