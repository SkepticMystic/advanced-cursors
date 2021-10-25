import { ItemView, MarkdownView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_AC } from "src/const";
import { CursorsModal } from "src/CursorsModal";
import type ACPlugin from "src/main";

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

  icon = "feather-mouse-pointer";

  async onOpen(): Promise<void> {
    await this.draw();
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }

  async draw(): Promise<void> {
    const { settings } = this.plugin;
    const { contentEl } = this;
    contentEl.empty();

    const listEl = contentEl.createEl("ol");
    settings.savedQueries.forEach((q) => {
      const listItem = listEl.createEl("li", { cls: "savedQ" });

      listItem.createSpan({ text: q.name, cls: "savedQ-name" });
      listItem.createSpan({ text: " → " });
      listItem.createSpan({ text: q.query });

      listItem.addEventListener("click", () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);

        if (view) {
          const { editor } = view;
          const cursorModal = new CursorsModal(this.app, editor, this.plugin);
          cursorModal.submit(q);
          editor.focus();
        }
      });
    });
  }
}
