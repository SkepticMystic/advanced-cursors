import { App, PluginSettingTab, Setting } from "obsidian";
import type MyPlugin from "src/main";

export class SettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;

		containerEl.empty();

		// containerEl.createEl("h2", { text: "Settings for my awesome plugin." });

		
	}
}
