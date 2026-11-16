import type { MetadataTypeManager } from "obsidian-typings";
import { around, dedupe } from "monkey-around";
import { getTrueProperty } from "~/CustomPropertyTypes/utils";
import { monkeyAroundKey } from "~/lib/constants";
import BetterProperties from "~/main";

export const patchMetadataTypeManager = (plugin: BetterProperties): void => {
	const removePatch = around(plugin.app.metadataTypeManager, {
		getAssignedWidget(old) {
			return dedupe(monkeyAroundKey, old, function(this: MetadataTypeManager, property) {
				return old.call(this, getTrueProperty(property));
			});
		},
		setType(old) {
			return dedupe(monkeyAroundKey, old, function(this: MetadataTypeManager, property, type) {
				return old.call(this, getTrueProperty(property), type);
			});
		},
	});

	plugin.registerRuntime(removePatch);
};
