import { asyncHandler } from "~/lib/async";
import { isEmptyProperty } from "~/core/properties";
import BetterProperties from "~/main";
import {
	CustomPropertyType,
	CustomTypeKey,
	getPropertyTypeSettings,
	PropertySettings,
} from ".";
import { selectPropertyType } from "./Select";
import { Notice, parseYaml, setIcon } from "obsidian";
import { customPropertyTypePrefix, monkeyAroundKey } from "~/lib/constants";
import { around, dedupe } from "monkey-around";
import { togglePropertyType } from "./Toggle";
// import { titlePropertyType } from "./Title";
import { markdownPropertyType } from "./Markdown";
import {
	MetadataTypeManagerRegisteredTypeWidgetsRecord,
	PropertyWidget,
} from "obsidian-typings";
// import { createdPropertyType } from "./Created";
import { objectPropertyType } from "./Object";
import { setPropertyTypeSettings, triggerPropertyTypeChange } from "./utils";
import { colorPropertyType } from "./Color";
import { ratingPropertyType } from "./Rating";
import { dateCustomPropertyType } from "./DateCustom";
import { syncTryCatch } from "~/lib/utils";
import { sliderPropertyType } from "./Slider";
import { timePropertyType } from "./Time";
import { multiSelectPropertyType } from "./MultiSelect";
import { numericPropertyType } from "./Numeric";
import { arrayPropertyType } from "./Array";
import { Icon } from "~/lib/types/icons";
// import { relationPropertyType } from "./Relation";

export const getCustomPropertyTypesArr = (): CustomPropertyType[] => [
	arrayPropertyType,
	selectPropertyType,
	multiSelectPropertyType,
	togglePropertyType,
	// titlePropertyType,
	markdownPropertyType,
	// createdPropertyType,
	objectPropertyType,
	colorPropertyType,
	ratingPropertyType,
	// relationPropertyType,
	dateCustomPropertyType,
	sliderPropertyType,
	timePropertyType,
	numericPropertyType,
];

export const getCustomPropertyTypesRecord = (): Record<
	CustomTypeKey,
	CustomPropertyType
> =>
	getCustomPropertyTypesArr().reduce((acc, cur) => {
		acc[cur.type] = cur;
		return acc;
	}, {} as Record<CustomTypeKey, CustomPropertyType>);

export const registerCustomPropertyTypeWidgets = (plugin: BetterProperties) => {
	getCustomPropertyTypesArr().forEach((customPropertyType) => {
		// @ts-expect-error TODO obsidian-typings issue I think
		const render: PropertyWidget["render"] = (el, value, ctx) => {
			return customPropertyType.renderWidget({ plugin, el, value, ctx });
		};
		const type = customPropertyTypePrefix + customPropertyType.type;
		const { icon, name, validate, reservedKeys } = customPropertyType;
		const registry = plugin.app.metadataTypeManager.registeredTypeWidgets;
		const previous = registry[type];
		const widget: PropertyWidget = {
			type,
			render,
			icon,
			name,
			validate,
			reservedKeys,
		};

		registry[type] = widget;
		plugin.ownedTypeWidgets.set(type, { widget, previous });

		customPropertyType.registerListeners(plugin);

		if (customPropertyType.reservedKeys?.length) {
			customPropertyType.reservedKeys.forEach((key) => {
				asyncHandler(() => plugin.app.metadataTypeManager.setType(key, type))();
			});
		}
	});
};

export const wrapAllPropertyTypeWidgets = (plugin: BetterProperties) => {
	const { registeredTypeWidgets } = plugin.app.metadataTypeManager;
	Object.values(registeredTypeWidgets).forEach((widget) => {
		const removePatch = around(widget, {
			render(old) {
				return dedupe(monkeyAroundKey, old, (containerEl, value, ctx) => {
					const toReturn = old(containerEl, value, ctx);

					containerEl.setAttribute("data-property-type", widget.type);
					const propertyEl = containerEl.parentElement;
					propertyEl?.setAttribute("data-better-properties-type", widget.type);
					propertyEl?.toggleAttribute(
						"data-better-properties-indent-guide",
						(widget.type === "better-properties:object" || widget.type === "better-properties:array") &&
							!!plugin.app.vault.getConfig("showIndentGuide")
					);

					const settings = getPropertyTypeSettings({
						plugin,
						property: ctx.key,
						type: "general",
					});

					const setSettings = (s: GeneralSettings) =>
						setPropertyTypeSettings({
							plugin,
							property: ctx.key,
							type: "general",
							typeSettings: s,
						});

					renderCollapseIndicator({
						propertyValueEl: containerEl,
						settings,
						setSettings,
					});

					if (settings.icon) {
						const iconEl = containerEl.parentElement?.querySelector(
							".metadata-property-icon"
						);
						if (iconEl?.instanceOf(HTMLElement)) {
							setIcon(iconEl, settings.icon);
						}
					}

					if (settings.hidden) {
						containerEl.parentElement?.setAttribute(
							"data-better-properties-hidden",
							"true"
						);
					}

					if (settings.defaultValue && isEmptyProperty(value)) {
						const update = (value: unknown) => {
							plugin.defer(() => {
								ctx.onChange(value);
								triggerPropertyTypeChange(
									plugin.app.metadataTypeManager,
									ctx.key
								);
							});
						};

						if (typeof value !== "object") {
							update(settings.defaultValue);
						} else {
							const parsedValue = syncTryCatch(() =>
								parseYaml(settings.defaultValue!)
							);
							if (!parsedValue.success) {
								const err = parsedValue.error;
								new Notice(err);
								console.error(err);
							}
							if (parsedValue.success) {
								update(parsedValue.data);
							}
						}
					}

					if (settings.alias) {
						const keyInputEl: HTMLInputElement | undefined | null =
							containerEl.parentElement?.querySelector(
								"input.metadata-property-key-input"
							);
						if (keyInputEl) {
							const existing = containerEl.parentElement?.querySelector<HTMLInputElement>(
								".better-properties-metadata-property-alias-input"
							);
							if (existing) {
								existing.classList.remove("better-properties-mod-hidden");
							}
							const aliasEl =
								existing ?? (keyInputEl.cloneNode() as HTMLInputElement);
							keyInputEl.insertAdjacentElement("afterend", aliasEl);
							keyInputEl.classList.add("better-properties-mod-hidden");
							keyInputEl.addEventListener("blur", () => {
								keyInputEl.classList.add("better-properties-mod-hidden");
								aliasEl.classList.remove("better-properties-mod-hidden");
							});
							aliasEl.value = settings.alias;
							aliasEl.classList.add(
								"better-properties-metadata-property-alias-input"
							);
							aliasEl.setAttribute("aria-disabled", "true");
							aliasEl.addEventListener("focus", () => {
								aliasEl.classList.add("better-properties-mod-hidden");
								keyInputEl.classList.remove("better-properties-mod-hidden");
								keyInputEl.focus();
							});
						}
					}

					return toReturn;
				});
			},
		});

		plugin.registerRuntime(removePatch);
	});
};

export const unregisterCustomPropertyTypeWidgets = (
	plugin: BetterProperties
) => {
	const registry = plugin.app.metadataTypeManager.registeredTypeWidgets;
	for (const [key, widget] of Object.entries(plugin.disabledTypeWidgets)) {
		if (registry[key] === undefined && !plugin.ownedTypeWidgets.has(key)) registry[key] = widget;
	}
	for (const [key, { widget, previous }] of plugin.ownedTypeWidgets) {
		if (registry[key] !== widget && registry[key] !== undefined) continue;
		if (previous) registry[key] = previous;
		else delete registry[key];
	}
	plugin.ownedTypeWidgets.clear();
	plugin.disabledTypeWidgets = {};
};

export const sortAndFilterRegisteredTypeWidgets = (
	plugin: BetterProperties
) => {
	const registered = {
		...plugin.disabledTypeWidgets,
		...plugin.app.metadataTypeManager.registeredTypeWidgets,
	};
	plugin.disabledTypeWidgets = {};
	const sortedKeys = Object.keys(registered).toSorted((a, b) => {
		const aName = registered[a as keyof typeof registered].name();
		const bName = registered[b as keyof typeof registered].name();
		return aName.localeCompare(bName);
	});
	const sortedWidgets = sortedKeys.reduce((acc, cur) => {
		const key = cur as keyof typeof registered;
		if (plugin.settings.hiddenPropertyTypes?.includes(registered[key]?.type)) {
			plugin.disabledTypeWidgets[cur] = registered[key];
			return acc;
		}
		acc[cur] = registered[key];
		return acc;
	}, {} as MetadataTypeManagerRegisteredTypeWidgetsRecord);

	// Preserve the registry object for integrations that retain a reference to it.
	const target = plugin.app.metadataTypeManager.registeredTypeWidgets;
	for (const key of Object.keys(target)) delete target[key];
	Object.assign(target, sortedWidgets);
	plugin.app.metadataTypeManager.trigger("changed");
};

type GeneralSettings = NonNullable<PropertySettings["general"]>;

const renderCollapseIndicator = ({
	settings,
	setSettings,
	propertyValueEl,
}: {
	propertyValueEl: HTMLElement;
	settings: GeneralSettings;
	setSettings: (s: GeneralSettings) => void;
}) => {
	const collapseCls =
		"better-properties-properties-property-collapse-indicator";
	const keyEl = propertyValueEl.parentElement?.querySelector(
		".metadata-property-key"
	);

	const existingCollapseIndicator: HTMLElement | undefined | null =
		keyEl?.querySelector(`& > .${collapseCls}`);

	existingCollapseIndicator?.remove();

	const collapseIndicator = keyEl?.createDiv({
		cls: collapseCls,
	});
	if (collapseIndicator) {
		setIcon(collapseIndicator, "lucide-chevron-down" satisfies Icon);

		const setAttr = (isCollapsed: boolean) => {
			const attr = "data-better-properties-is-collapsed";
			propertyValueEl.parentElement?.toggleAttribute(attr, isCollapsed);
			isCollapsed
				? collapseIndicator.setAttribute(attr, "true")
				: collapseIndicator.removeAttribute(attr);
		};

		setAttr(!!settings.collapsed);

		collapseIndicator.addEventListener("click", () => {
			settings.collapsed = !settings.collapsed;
			setAttr(settings.collapsed);
			setSettings({ ...settings });
		});
	}
};
