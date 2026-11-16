import * as v from "valibot";
import type { PropertyTypeSchema } from "../types";

export const selectSettingsSchema = v.optional(
	v.object({
		useDefaultStyle: v.optional(v.boolean(), false),
		optionsType: v.optional(
			v.union([v.literal("manual"), v.literal("dynamic")]),
			"manual"
		),
		manualAllowCreate: v.optional(v.boolean()),
		manualOptions: v.optional(
			v.array(
				v.object({
					value: v.string(),
					label: v.optional(v.string()),
					desc: v.optional(v.string()),
					bgColor: v.optional(v.string()),
					textColor: v.optional(v.string()),
				})
			)
		),
		dynamicOptionsType: v.optional(
			v.union([
				v.literal("filesInFolder"),
				v.literal("filesFromTag"),
				v.literal("filesFromInlineJs"),
				v.literal("filesFromJsFile"),
			])
		),
		dynamicEmptyLabel: v.optional(v.string()),
		folderOptionsPaths: v.optional(v.array(v.string())),
		folderOptionsIsSubsIncluded: v.optional(v.boolean()),
		folderOptionsExcludeFolderNote: v.optional(v.boolean()),
		tagOptionsTags: v.optional(v.array(v.string())),
		tagOptionsIncludeNested: v.optional(v.boolean()),
		inlineJsOptionsCode: v.optional(v.string()),
		fileJsOptionsPath: v.optional(v.string()),
	})
) satisfies PropertyTypeSchema;
