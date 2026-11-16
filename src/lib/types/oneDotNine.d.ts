// Obsidian 1.9+ scope additions used by the embedded editor.
import "obsidian";

declare module "obsidian" {
	interface Scope {
		setTabFocusContainerEl(el: HTMLElement): void;
	}
}
