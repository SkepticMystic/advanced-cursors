import { App, Modal, Notice, PluginSettingTab } from "obsidian";
import type MyPlugin from "src/main";

export class SettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  initExistingSavedQs = (savedQsDiv: HTMLDivElement) => {
    savedQsDiv.empty();
    this.plugin.settings.savedQueries.forEach((savedQ, i) => {
      const savedQDiv = savedQsDiv.createDiv({ cls: "savedQ" });
      savedQDiv.createSpan({ text: savedQ.name, cls: "savedQ-name" });
      savedQDiv.createSpan({ text: ": " });
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
    copy.splice(i, 1);
    settings.savedQueries = copy;
    await this.plugin.saveSettings();
    console.log(settings.savedQueries, copy);
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
          new AddQModal(this.app, this.plugin, this, savedQsDiv).open();
        });
      }
    );
    const savedQsDiv = containerEl.createDiv({ cls: "savedQs" });

    this.initExistingSavedQs(savedQsDiv);
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
    const { savedQueries } = this.plugin.settings;
    const nameEl = contentEl.createEl("input", {
      type: "text",
      attr: { placeholder: "name" },
    });
    const queryEl = contentEl.createEl("input", {
      type: "text",
      attr: { placeholder: "query" },
    });
    contentEl
      .createDiv()
      .createEl("button", { text: "Add new query" }, (but) => {
        but.addEventListener("click", async () => {
          const name = nameEl.value;
          const query = queryEl.value;

          if (savedQueries.findIndex((q) => q.name === name) > -1) {
            new Notice(`A query with name: ${name} already exists`);
          } else {
            this.plugin.settings.savedQueries.push({
              name,
              query,
            });
            await this.plugin.saveSettings();
            console.log(this.plugin.settings.savedQueries);
            new Notice(`${name}: ${query} added.`);
            this.settingsTab.initExistingSavedQs(this.savedQsDiv);
            this.close();
          }
        });
      });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
