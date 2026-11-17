import { createObsidianTest } from "obsidian-plugin-dev-kit/e2e";

const kit = createObsidianTest({
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

export const expect = kit.expect;
export const test = kit.test.extend<{ runtimeConsole: void }>({
	runtimeConsole: [async ({ app }, use, info) => {
		info.annotations.push({ type: "electron-version", description: await app.evaluate(() => process.versions.electron) });
		await use();
		const errors: unknown = await app.evaluate(({ app }) => Reflect.get(app, "betterPropertiesTestErrors"));
		expect(errors, "Unexpected renderer errors, including startup and popout errors").toEqual([]);
	}, { auto: true }],
});
