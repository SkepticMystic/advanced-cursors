import { App, Editor, Modal } from "obsidian";
import type ACPlugin from "src/main";
import QueryModal from "./Components/QueryModal.svelte";

export class CursorsModal extends Modal {
  ed: Editor;
  plugin: ACPlugin;

  constructor(app: App, ed: Editor, plugin: ACPlugin) {
    super(app);
    this.ed = ed;
    this.plugin = plugin;
  }

  async onOpen() {
    let { contentEl, plugin, ed } = this;

    new QueryModal({
      target: contentEl,
      props: { modal: this, plugin, ed },
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
