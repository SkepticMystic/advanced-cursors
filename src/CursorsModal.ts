import {
  App,
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  Modal,
  Notice,
} from "obsidian";
import type MyPlugin from "src/main";
import QueryModal from "./Components/QueryModal.svelte";

export class CursorsModal extends Modal {
  editor: Editor;
  plugin: MyPlugin;

  constructor(app: App, editor: Editor, plugin: MyPlugin) {
    super(app);
    this.editor = editor;
    this.plugin = plugin;
  }

  async getSelectionAndOffset() {
    const selection = this.editor.getSelection();
    const offset = this.editor.getCursor("from").line;
    if (selection !== "") {
      return { selection, offset };
    } else {
      const currFile = this.app.workspace.getActiveFile();
      const content = await this.app.vault.cachedRead(currFile);
      return { selection: content, offset: 0 };
    }
  }

  getSelectionsFromQuery(
    content: string,
    offset: number,
    query: string,
    regexQ: boolean
  ) {
    let regex: RegExp;
    if (regexQ) {
      regex = new RegExp(query, "g");
    } else {
      regex = new RegExp(query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
    }

    const lines = content.split("\n");
    const selections: EditorSelectionOrCaret[] = [];

    lines.forEach((line, i) => {
      const matches = line.matchAll(regex);
      const matchesArr = [...matches];

      matchesArr.forEach((matchArr) => {
        const from = matchArr.index;
        if (from !== undefined) {
          const anchor: EditorPosition = {
            ch: from,
            line: i + offset,
          };
          const head: EditorPosition = {
            ch: from + matchArr[0].length,
            line: i + offset,
          };
          selections.push({ anchor, head });
        }
      });
    });

    return selections;
  }

  submit = (
    query: string,
    selection: string,
    offset: number,
    regexQ: boolean
  ) => {
    try {
      const selections = this.getSelectionsFromQuery(
        selection,
        offset,
        query,
        regexQ
      );

      console.log({ selections });
      new Notice(`${selections.length} matches found.`);

      this.editor.setSelections(selections);
      this.close();
    } catch (error) {
      console.log(error);
      new Notice("Something went wrong, check the console for the error.");
    }
  };

  async onOpen() {
    let { contentEl } = this;

    new QueryModal({
      target: contentEl,
      props: { modal: this, plugin: this.plugin },
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
