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
    contentEl.style.padding = "5px 5px 0px 5px";

    const qsDiv = contentEl.createDiv();
    settings.savedQueries.forEach((q) => {
      const qDiv = qsDiv.createDiv({ text: q.name, cls: "savedQ-view-q" });
      qDiv.ariaLabel = `/${q.query}/${q.flags}`;

      qDiv.addEventListener("click", () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          const { editor } = view;
          const cursorModal = new CursorsModal(this.app, editor, this.plugin);
          cursorModal.submit(q);
          editor.focus();
        }
      });

      qDiv.addEventListener("contextmenu", () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
          const { editor } = view;
          this.plugin.selectNextInstance(editor, false, q);
          editor.focus();
        }
      });
    });
  }
}
