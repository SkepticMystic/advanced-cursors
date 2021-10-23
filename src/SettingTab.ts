import { App, Modal, Notice, PluginSettingTab } from "obsidian";
import type { Query } from "src/interfaces";
import type ACPlugin from "src/main";
import { cmdNextId, cmdRunId } from "src/utils";
import AddQComponent from "./Components/AddQComponent.svelte";

export class ACSettingTab extends PluginSettingTab {
  plugin: ACPlugin;
  savedQsDiv: HTMLDivElement;

  constructor(app: App, plugin: ACPlugin) {
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
          text: "❌",
          cls: "deleteQButton",
        },
        (but) => {
          but.addEventListener("click", async () => {
            savedQLi.remove();
            await this.removeSavedQ(i);
          });
        }
      );

      savedQLi.createEl(
        "button",
        {
          text: "✏️",
          cls: "editQButton",
        },
        (but) => {
          but.addEventListener("click", () => {
            console.log("editing" + i);
            this.editSavedQ(i);
          });
        }
      );
    });
  };

  editSavedQ(i: number) {
    const { settings } = this.plugin;
    const existingQ = settings.savedQueries[i];

    new AddQModal(
      this.app,
      this.plugin,
      this,
      this.savedQsDiv,
      existingQ,
      i
    ).open();
  }

  removeSavedQ = async (i: number) => {
    try {
      const { settings } = this.plugin;
      const copy = [...settings.savedQueries];
      const removedQ = copy.splice(i, 1)[0];

      settings.savedQueries = copy;
      await this.plugin.saveSettings();
      console.log({ savedQs: settings.savedQueries, removedQ });
      this.initExistingSavedQs(this.savedQsDiv);

      this.app.commands.removeCommand(cmdRunId(removedQ));
      this.app.commands.removeCommand(cmdNextId(removedQ));
    } catch (error) {
      console.log(error);
      new Notice(
        `Something went wrong when deleting that query. Check the console for errors.`
      );
    }
  };

  display(): void {
    let { containerEl } = this;
    const { settings } = this.plugin;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Advanced Cursors Settings" });
    containerEl.createEl("h3", { text: "Saved Queries" });

    containerEl.createEl("button", { text: "Add Query" }, (but) => {
      but.addEventListener("click", () => {
        new AddQModal(
          this.app,
          this.plugin,
          this,
          this.savedQsDiv,
          { name: "", query: "", flags: "", regexQ: true },
          -1
        ).open();
      });
    });
    this.savedQsDiv = containerEl.createDiv({ cls: "savedQs" });
    this.initExistingSavedQs(this.savedQsDiv);
  }
}

export class AddQModal extends Modal {
  plugin: ACPlugin;
  settingsTab: ACSettingTab;
  savedQsDiv: HTMLDivElement;
  existingQ: Query;
  i: number;

  constructor(
    app: App,
    plugin: ACPlugin,
    settingsTab: ACSettingTab,
    savedQsDiv: HTMLDivElement,
    existingQ: Query,
    i: number
  ) {
    super(app);
    this.plugin = plugin;
    this.settingsTab = settingsTab;
    this.savedQsDiv = savedQsDiv;
    this.existingQ = existingQ;
    this.i = i;
  }

  async onOpen() {
    let { contentEl } = this;

    new AddQComponent({
      target: contentEl,
      props: {
        plugin: this.plugin,
        modal: this,
        settingsTab: this.settingsTab,
        existingQ: this.existingQ,
        i: this.i,
      },
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
