import { App, Modal, PluginSettingTab } from "obsidian";
import type MyPlugin from "src/main";
import AddQComponent from "./Components/AddQComponent.svelte";

export class SettingTab extends PluginSettingTab {
  plugin: MyPlugin;
  savedQsDiv: HTMLDivElement;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  initExistingSavedQs = (savedQsDiv: HTMLDivElement) => {
    savedQsDiv.empty();
    const listEl = savedQsDiv.createEl("ol");
    this.plugin.settings.savedQueries.forEach((savedQ, i) => {
      const savedQLi = listEl.createEl("li", { cls: "savedQ" });

      savedQLi.createSpan({ text: savedQ.name, cls: "savedQ-name" });
      savedQLi.createSpan({ text: " → " });
      savedQLi.createSpan({ text: savedQ.query });

      savedQLi.createEl(
        "button",
        {
          text: "X",
          cls: "deleteQButton",
        },
        (but) => {
          but.addEventListener("click", async () => {
            savedQLi.remove();
            this.removeSavedQ(i);
          });
        }
      );
    });
  };

  removeSavedQ = async (i: number) => {
    const { settings } = this.plugin;
    const copy = [...settings.savedQueries];
    const removedQ = copy.splice(i, 1);

    settings.savedQueries = copy;
    await this.plugin.saveSettings();
    console.log({ savedQs: settings.savedQueries, removedQ: removedQ[0] });

    const { name, query } = removedQ[0];

    this.app.commands.removeCommand(`advanced-cursors:AC-${name}: ${query}`);
  };

  display(): void {
    let { containerEl } = this;
    const { settings } = this.plugin;
    containerEl.empty();

    containerEl.createEl("button", { text: "Add Query" }, (but) => {
      but.addEventListener("click", () => {
        new AddQModal(this.app, this.plugin, this, this.savedQsDiv).open();
      });
    });
    this.savedQsDiv = containerEl.createDiv({ cls: "savedQs" });
    this.initExistingSavedQs(this.savedQsDiv);
  }
}

export class AddQModal extends Modal {
  plugin: MyPlugin;
  settingsTab: SettingTab;
  savedQsDiv: HTMLDivElement;

  constructor(
    app: App,
    plugin: MyPlugin,
    settingsTab: SettingTab,
    savedQsDiv: HTMLDivElement
  ) {
    super(app);
    this.plugin = plugin;
    this.settingsTab = settingsTab;
    this.savedQsDiv = savedQsDiv;
  }

  async onOpen() {
    let { contentEl } = this;

    new AddQComponent({
      target: contentEl,
      props: {
        app: this.app,
        plugin: this.plugin,
        modal: this,
        settingsTab: this.settingsTab,
      },
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
