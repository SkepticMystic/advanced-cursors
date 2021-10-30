import { App, Editor, Modal } from "obsidian";
import type ACPlugin from "src/main";
import QueryModal from "./Components/QueryModal.svelte";

export class CursorsModal extends Modal {
  editor: Editor;
  plugin: ACPlugin;

  constructor(app: App, editor: Editor, plugin: ACPlugin) {
    super(app);
    this.editor = editor;
    this.plugin = plugin;
  }

  async onOpen() {
    let { contentEl, plugin, editor } = this;

    new QueryModal({
      target: contentEl,
      props: { modal: this, plugin, editor },
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
