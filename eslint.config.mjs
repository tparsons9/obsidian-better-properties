import { obsidianPlugin } from "obsidian-plugin-dev-kit/eslint";

const preset = obsidianPlugin({
	rootDir: import.meta.dirname,
	ignores: ["docs/**", "vitest.config.mts", "test-results/**", "playwright-report/**"],
});
// Expand the namespace restriction so a single nested rule can be excepted without
// unrestricting all settings-tab rules (gitignore patterns cannot reinclude a child).
const restrictedDisables = [...new Set([
	...preset.flatMap((config) => Object.keys(config.rules ?? {}).filter((rule) =>
		rule.startsWith("obsidianmd/") && rule !== "obsidianmd/no-misused-promises")),
	"no-console", "no-restricted-globals", "@typescript-eslint/no-restricted-imports",
	"no-alert", "@typescript-eslint/no-deprecated", "@typescript-eslint/no-explicit-any",
	"@microsoft/sdl/no-document-write", "@microsoft/sdl/no-inner-html", "no-eval",
])];
const allowComments = (...allowed) => ["error", ...restrictedDisables.filter((rule) => !allowed.includes(rule))];

export default [
	...preset,
	{ files: ["src/test/**/*.ts"], languageOptions: { parserOptions: { project: "./tsconfig.test.json" } } },
	{
		files: ["src/CustomPropertyTypes/Select/utils.ts", "src/CustomPropertyTypes/MultiSelect/utils.ts"],
		rules: { "eslint-comments/no-restricted-disable": allowComments("no-eval") },
	},
	{
		files: ["src/bpjs/api.ts"],
		rules: { "eslint-comments/no-restricted-disable": allowComments("no-eval", "obsidianmd/no-forbidden-elements") },
	},
	{
		files: ["src/Plugin/settings.ts"],
		rules: { "eslint-comments/no-restricted-disable": allowComments("obsidianmd/settings-tab/prefer-setting-definitions") },
	},
];
