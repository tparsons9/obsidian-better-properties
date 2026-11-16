import { createObsidianTest } from "obsidian-plugin-dev-kit/e2e";

export const { test, expect } = createObsidianTest({
	seedVault: "e2e/vault",
	sweepAfterHours: false,
	data: {
		"better-properties": {
			propertySettings: {
				filedynamic: { select: { optionsType: "dynamic", dynamicOptionsType: "filesFromJsFile", fileJsOptionsPath: "Options.js" } },
				flag: { general: { defaultValue: "true" } },
				score: { general: { defaultValue: "42" } },
				status: { select: { manualOptions: [{ value: "todo" }, { value: "done" }] } },
				choices: { multiselect: { manualOptions: [{ value: "apple" }, { value: "banana" }] } },
				dynamic: { select: { optionsType: "dynamic", dynamicOptionsType: "filesFromInlineJs", inlineJsOptionsCode: 'async () => [{ value: "scripted" }]' } },
			},
		},
	},
});
