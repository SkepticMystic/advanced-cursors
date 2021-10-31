import { App, Editor, Modal } from "obsidian";
import type ACPlugin from "src/main";
import IncrementingIComponent from "./Components/IncrementingIComponent.svelte";

export class IncrementingIModal extends Modal {
  ed: Editor;
  plugin: ACPlugin;

  constructor(app: App, plugin: ACPlugin, ed: Editor) {
    super(app);
    this.ed = ed;
    this.plugin = plugin;
  }

  async onOpen() {
    let { contentEl, plugin, ed } = this;

    new IncrementingIComponent({
      target: contentEl,
      props: { plugin, ed, modal: this },
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
