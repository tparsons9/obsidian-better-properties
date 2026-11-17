import { obsidianText } from "~/i18next/obsidian";
import { CustomPropertyType } from "../types";
import { PropertyWidgetComponentNew } from "../utils";
import {
	TEmbeddableMarkdownEditor,
	createEmbeddableMarkdownEditor,
} from "~/classes/EmbeddableMarkdownEditor";
import { PropertyRenderContext } from "obsidian-typings";
import BetterProperties from "~/main";
import { StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export const renderWidget: CustomPropertyType["renderWidget"] = ({
	plugin,
	el,
	ctx,
	value,
}) => {
	return new MarkdownTypeComponent(plugin, el, value, ctx);
};

class MarkdownTypeComponent extends PropertyWidgetComponentNew<
	"markdown",
	string
> {
	type = "markdown" as const;
	parseValue = (v: unknown) => v?.toString() ?? "";

	embeddedMarkdownEditor: TEmbeddableMarkdownEditor;

	constructor(
		plugin: BetterProperties,
		el: HTMLElement,
		value: unknown,
		ctx: PropertyRenderContext
	) {
		super(plugin, el, value, ctx);

		const parsed = this.parseValue(value);
		this.embeddedMarkdownEditor = createEmbeddableMarkdownEditor({
			app: plugin.app,
			container: el,
			options: {
				value: parsed,
				onBlur: (editor) => {
					const val = editor.editor?.getValue() ?? "";
					this.setValue(val);
				},
				placeholder: obsidianText("properties.label-no-value"),
			},
			filePath: ctx.sourcePath,
		});
		// CodeMirror owns this listener and removes it when the editor is destroyed.
		const syncFoldClass = () => el.classList.toggle(
			"better-properties-markdown-has-folds",
			!!el.querySelector(".collapse-indicator.collapse-icon")
		);
		// obsidian-typings duplicates CodeMirror's types, including private effect fields.
		const view = this.embeddedMarkdownEditor.editor?.cm as unknown as EditorView | undefined;
		view?.dispatch({
			effects: StateEffect.appendConfig.of(EditorView.updateListener.of(syncFoldClass)),
		});
		syncFoldClass();

		this.onFocus = () => {
			this.embeddedMarkdownEditor.focus();
		};

		if (!plugin.app.vault.getConfig("showLineNumber")) {
			el.setAttribute("data-better-properties-showLineNumber", "false");
		}
	}

	getValue(): string {
		return this.embeddedMarkdownEditor.editor?.getValue() ?? "";
	}

	setValue(value: unknown): void {
		if (this.embeddedMarkdownEditor.editor?.getValue() !== value) {
			this.embeddedMarkdownEditor.editor?.setValue(this.parseValue(value));
		}
		super.setValue(value);
	}
}
