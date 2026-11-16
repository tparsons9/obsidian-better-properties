import { asyncHandler } from "~/lib/async";
import {
	MarkdownPostProcessorContext,
	MarkdownRenderChild,
	Component,
	Plugin,
} from "obsidian";
import BetterProperties from "~/main";
import { BpJsApi } from "./api";

export const createCodeBlockProcessor = (
	plugin: BetterProperties
): Parameters<Plugin["registerMarkdownCodeBlockProcessor"]> => {
	const cb = (
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) => {
		el.classList.add("better-properties-bpjs-codeblock");
		const mdrc = new MarkdownRenderChild(el);
		ctx.addChild(mdrc);
		const component = new Component();
		mdrc.addChild(component);
		plugin.addChild(component);
		const api = new BpJsApi(plugin, el, ctx.sourcePath, component, source);
		asyncHandler(() => api.run(source))();
		// api.monitorSubsribedPaths();
	};

	const BPJS = "bpjs";

	const cm = activeWindow.CodeMirror as typeof activeWindow.CodeMirror & {
		getMode(config: Record<string, unknown>, name: string): unknown;
		modes?: Record<string, unknown>;
	};
	const previous = cm.modes?.[BPJS];
	cm.defineMode(BPJS, (config: Record<string, unknown>) => cm.getMode(config, "javascript"));
	const owned = cm.modes?.[BPJS];
	plugin.registerRuntime(() => {
		if (!cm.modes || cm.modes[BPJS] !== owned) return;
		if (previous === undefined) delete cm.modes[BPJS];
		else cm.modes[BPJS] = previous;
	});
	return [BPJS, cb];
};
