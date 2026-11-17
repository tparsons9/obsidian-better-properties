import { defineUnitConfig } from "obsidian-plugin-dev-kit/vitest";
import { mergeConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default mergeConfig(defineUnitConfig({
	rootDir: import.meta.dirname,
	obsidian: "./src/test/stubs/obsidian.ts",
	coverage: {
		// Cover the data/lifecycle core, schemas and translation boundary, not all UI code.
		include: ["src/core/**/*.ts", "src/Plugin/schema.ts", "src/CustomPropertyTypes/**/schema.ts", "src/CustomPropertyTypes/schema.ts", "src/i18next/**/*.ts", "src/bpjs/legacyMode.ts"],
		extraReporters: ["html"],
	},
}), {
	resolve: { alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) } },
});
