import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const markdownSettingsSchema = v.optional(
	v.object({})
) satisfies PropertyTypeSchema;
