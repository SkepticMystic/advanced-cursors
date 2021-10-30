import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import { addFeatherIcon } from "obsidian-community-lib";
import { VIEW_TYPE_AC } from "src/const";
import type ACPlugin from "src/main";
import { displayRegex } from "src/utils";

export default class SavedQView extends ItemView {
  private plugin: ACPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: ACPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  async onload(): Promise<void> {
    super.onload();
  }

  getViewType(): string {
    return VIEW_TYPE_AC;
  }

  getDisplayText(): string {
    return "Saved Queries";
  }

  icon = addFeatherIcon("mouse-pointer") as string;

  async onOpen(): Promise<void> {
    await this.draw();
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }

  async draw(): Promise<void> {
    const {
      settings: { savedQueries },
    } = this.plugin;
    const {
      contentEl,
      app: { workspace },
      plugin,
    } = this;
    contentEl.empty();
    contentEl.style.padding = "5px 5px 0px 5px";

    const qsDiv = contentEl.createDiv();
    savedQueries.forEach((q) => {
      const qDiv = qsDiv.createDiv({ text: q.name, cls: "savedQ-view-q" });
      qDiv.ariaLabel = displayRegex(q);

      qDiv.addEventListener("contextmenu", () => {
        const view = workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          const { editor: ed } = view;
          plugin.selectInstance(ed, false, "All", q);
          ed.focus();
        }
      });

      qDiv.addEventListener("click", () => {
        const view = workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          const { editor: ed } = view;
          plugin.selectInstance(ed, false, "Next", q);
          ed.focus();
        }
      });
    });
  }
}
