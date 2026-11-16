import { asyncHandler } from "~/lib/async";
import { CleanupStore } from "~/core/lifecycle";
import { SaveQueue } from "~/core/persistence";
import { Modal, ButtonComponent, Plugin, MarkdownView, Notice } from "obsidian";
import {
	BetterPropertiesSettings,
	betterPropertiesSettingsSchema,
	getDefaultSettings,
} from "./schema";
import { BetterPropertiesSettingsTab } from "./settings";
import {
	registerCustomPropertyTypeWidgets,
	sortAndFilterRegisteredTypeWidgets,
	unregisterCustomPropertyTypeWidgets,
	wrapAllPropertyTypeWidgets,
} from "~/CustomPropertyTypes/register";
import {
	customizePropertyEditorMenu,
	patchMetadataEditor,
} from "~/MetadataEditor";
import { PropertyWidget } from "obsidian-typings";
import { PropertySuggestModal } from "~/classes/InputSuggest/PropertySuggest";
import { showPropertySettingsModal } from "~/CustomPropertyTypes/settings";
import { patchMetadataCache } from "~/MetadataCache";
import * as v from "valibot";
import { openRenameModal } from "~/MetadataEditor/propertyEditorMenu/rename";
import { registerBpJsCodeProcessors } from "~/bpjs";
import { BpJsApi, setupBpJsListeners } from "~/bpjs/api";
import { patchMetadataTypeManager } from "~/MetadataTypeManager/patchMetadataTypeManager";

export class BetterProperties extends Plugin {
	settings: BetterPropertiesSettings = getDefaultSettings();
	disabledTypeWidgets: Record<string, PropertyWidget> = {};
	ownedTypeWidgets = new Map<string, { widget: PropertyWidget; previous?: PropertyWidget }>();
	private runtime = new CleanupStore();
	private active = false;
	private settingsValid = true;
	private saves = new SaveQueue<BetterPropertiesSettings>((settings) => this.saveData(settings));
	codePrefix = "bpjs:"; // TODO make configurable

	bpjsInstances: Set<BpJsApi> = new Set();

	async onload(): Promise<void> {
		this.active = true;
		await this.loadSettings();
		if (!this.active) return;
		this.addSettingTab(new BetterPropertiesSettingsTab(this));
		patchMetadataTypeManager(this);
		registerCustomPropertyTypeWidgets(this);
		wrapAllPropertyTypeWidgets(this);
		sortAndFilterRegisteredTypeWidgets(this);
		this.setupCommands();
		this.app.workspace.onLayoutReady(() => {
			if (!this.active) return;
			customizePropertyEditorMenu(this);
			patchMetadataEditor(this);
			patchMetadataCache(this);
			setupBpJsListeners(this);
			registerBpJsCodeProcessors(this);

			this.rebuildLeaves();
		});
		this.handlePropertyLabelWidth();
		this.registerEvent(
			this.app.vault.on("config-changed", () => {
				this.refreshPropertyEditors();
			})
		);
	}

	rebuildLeaves(): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			asyncHandler(() => leaf.rebuildView && leaf.rebuildView())();
		});
	}

	refreshPropertyEditors(): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (!(leaf.view instanceof MarkdownView)) return;
			const me = leaf.view.metadataEditor;
			if (!me) return;
			asyncHandler(() => leaf.rebuildView())();
		});
	}

	setupCommands(): void {
		this.addCommand({
			id: "refresh-property-editors",
			name: "Refresh Property Editors",
			callback: () => {
				this.refreshPropertyEditors();
			},
		});
		this.addCommand({
			id: "rebuild-views",
			name: "Rebuild views",
			callback: () => {
				this.rebuildLeaves();
			},
		});
		this.addCommand({
			id: "open-property-settings",
			name: "Open property settings",
			callback: () => {
				const modal = new PropertySuggestModal(this);
				modal.onChooseItem = (item) => {
					modal.close();
					showPropertySettingsModal({
						plugin: this,
						property: item.name,
					});
				};
				modal.open();
			},
		});
		this.addCommand({
			id: "rename-property",
			name: "Rename property",
			callback: () => {
				const modal = new PropertySuggestModal(this);
				modal.onChooseItem = (item) => {
					modal.close();
					openRenameModal({
						plugin: this,
						property: item.name,
					});
				};
				modal.open();
			},
		});
	}

	registerRuntime(cleanup: () => void): () => void {
		return this.runtime.add(cleanup);
	}

	defer(callback: () => void): void {
		const timer = window.setTimeout(() => {
			forget();
			if (this.active) callback();
		}, 0);
		const forget = this.registerRuntime(() => window.clearTimeout(timer));
	}

	handlePropertyLabelWidth(): void {
		const bodies = new Map<HTMLElement, { value: string; priority: string; defaultWidth: string }>();
		const updateBody = (body: HTMLElement) => {
			if (!bodies.has(body)) bodies.set(body, {
				value: body.style.getPropertyValue("--metadata-label-width"),
				priority: body.style.getPropertyPriority("--metadata-label-width"),
				defaultWidth: body.getCssPropertyValue("--metadata-label-width") || "9em",
			});
			const width = this.settings.propertyLabelWidth;
			body.setCssProps({ "--metadata-label-width": width === undefined ? bodies.get(body)!.defaultWidth : `${width}px` });
		};
		updateBody(activeDocument.body);
		this.app.workspace.iterateAllLeaves((leaf) => updateBody(leaf.view.containerEl.doc.body));
		const opened = this.app.workspace.on("window-open", (_window, browserWindow) => updateBody(browserWindow.document.body));
		const changed = this.app.workspace.on("better-properties:property-label-width-change", (width) => {
			this.settings.propertyLabelWidth = width;
			for (const body of bodies.keys()) updateBody(body);
			this.persistSettings();
		});
		this.registerRuntime(() => {
			this.app.workspace.offref(opened);
			this.app.workspace.offref(changed);
			for (const [body, previous] of bodies) {
				if (previous.value) body.style.setProperty("--metadata-label-width", previous.value, previous.priority);
				else body.style.removeProperty("--metadata-label-width");
			}
			bodies.clear();
		});
	}

	onunload(): void {
		this.active = false;
		try { this.runtime.dispose(); } catch (error) { console.error(error); }
		unregisterCustomPropertyTypeWidgets(this);
		this.bpjsInstances.forEach((bpjs) => bpjs.component.unload());
		this.bpjsInstances.clear();
		this.refreshPropertyEditors();
	}

	persistSettings(): void {
		if (!this.settingsValid) return;
		void this.saveSettings().catch((error: unknown) => {
			console.error(error);
			new Notice(`Better Properties: Could not save settings: ${String(error)}`);
		});
	}

	async onExternalSettingsChange() {
		await this.loadSettings();
	}

	async loadSettings() {
		const loaded: unknown = await this.loadData();

		// no settings yet, use default
		if (loaded === null || loaded === undefined) {
			this.settingsValid = true;
			this.settings = getDefaultSettings();
			return;
		}

		const parsed = v.safeParse(betterPropertiesSettingsSchema, loaded);
		// settings are valid, so use them
		if (parsed.success) {
			this.settingsValid = true;
			this.settings = parsed.output;
			return;
		}

		this.settingsValid = false;
		// Preserve invalid data until the user explicitly resets it.
		const msg0 = "Better Properties: Invalid plugin settings detected!";
		const msg1 =
			"This likely happened because you modified the plugin's settings.json file directly. If not, please open an issue on the plugin's github repository";
		console.error(msg0 + "\n" + msg1);
		console.error(parsed.issues);
		const modal = new Modal(this.app);
		modal.setTitle(msg0);
		modal.contentEl.createEl("p", { text: msg1 });
		modal.contentEl.createEl("p", {
			text: "You can also reset the plugin's settings entirely by clicking the button below.",
		});
		const btnContainer = modal.contentEl.createDiv({
			cls: "modal-button-container",
		});
		new ButtonComponent(btnContainer)
			.setWarning()
			.setButtonText("Reset settings")
			.onClick(() => {
				this.settings = getDefaultSettings();
				this.settingsValid = true;
				this.persistSettings();
				modal.close();
			});

		modal.open();
		return;
	}

	async saveSettings(): Promise<void> {
		if (!this.settingsValid) throw new Error("Settings must be reset before saving invalid data.");
		await this.saves.save(this.settings);
	}

	async updateSettings(
		cb: (prev: BetterPropertiesSettings) => BetterPropertiesSettings
	): Promise<void> {
		const newSettings = cb(this.settings);
		this.settings = { ...newSettings };
		await this.saveSettings();
	}
}
