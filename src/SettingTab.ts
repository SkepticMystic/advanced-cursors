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
    this.plugin.settings.savedQueries.forEach((savedQ, i) => {
      const savedQDiv = savedQsDiv.createDiv({ cls: "savedQ" });
      savedQDiv.createSpan({ text: savedQ.name, cls: "savedQ-name" });
      savedQDiv.createSpan({ text: " → " });
      savedQDiv.createSpan({ text: savedQ.query });

      const deleteQ = savedQDiv.createEl("button", {
        text: "X",
        cls: "deleteQButton",
      });
      deleteQ.addEventListener("click", async () => {
        savedQDiv.remove();
        this.removeSavedQ(i);
      });
    });
  };

  removeSavedQ = async (i: number) => {
    const { settings } = this.plugin;
    const copy = [...settings.savedQueries];
    const removedQ = copy.splice(i, 1);
    settings.savedQueries = copy;
    await this.plugin.saveSettings();
    console.log(settings.savedQueries, copy);

    const { name, query } = removedQ[0];

    this.app.commands.removeCommand(`advanced-cursors:AC-${name}: ${query}`);
  };

  display(): void {
    let { containerEl } = this;
    const { settings } = this.plugin;

    containerEl.empty();

    const addQButton = containerEl.createEl(
      "button",
      { text: "Add Query" },
      (but) => {
        but.addEventListener("click", () => {
          console.log("clicked");
          new AddQModal(this.app, this.plugin, this, this.savedQsDiv).open();
        });
      }
    );
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
