import {
  App,
  MarkdownRenderer,
  Modal,
  Notice,
  PluginSettingTab,
  request,
} from "obsidian";
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

      this.plugin.view.draw();
    } catch (error) {
      console.log(error);
      new Notice(
        `Something went wrong when deleting that query. Check the console for errors.`
      );
    }
  };

  async display(): Promise<void> {
    let { containerEl } = this;
    const { settings } = this.plugin;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Advanced Cursors Settings" });
    // SECTION SavedQs
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

    // SECTION Changelog

    containerEl.createEl("hr");
    containerEl.createEl("button", { text: "Changelog" }, (but) =>
      but.onClickEvent(() => {
        new ChangelogModal(this.app, this.plugin).open();
      })
    );
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
        app: this.app,
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

export class ChangelogModal extends Modal {
  plugin: ACPlugin;

  constructor(app: App, plugin: ACPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    let { contentEl } = this;
    const changelog = await request({
      url: "https://raw.githubusercontent.com/SkepticMystic/advanced-cursors/master/CHANGELOG.md",
    });

    const logDiv = contentEl.createDiv();
    MarkdownRenderer.renderMarkdown(changelog, logDiv, "", this.plugin);
  }

  onClose() {
    this.contentEl.empty();
  }
}
