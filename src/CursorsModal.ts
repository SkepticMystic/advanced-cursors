import { App, Editor, EditorSelectionOrCaret, Modal, Notice } from "obsidian";
import type { Query } from "src/interfaces";
import type ACPlugin from "src/main";
import { createRegex } from "src/utils";
import QueryModal from "./Components/QueryModal.svelte";

export class CursorsModal extends Modal {
  editor: Editor;
  plugin: ACPlugin;

  constructor(app: App, editor: Editor, plugin: ACPlugin) {
    super(app);
    this.editor = editor;
    this.plugin = plugin;
  }
  /**
   * If something is selected, return that, and the offset inside the content. Otherwise return the entire content of the note
   */
  getSelectionAndOffset() {
    const selection = this.editor.getSelection();
    const offset = this.editor.posToOffset(this.editor.getCursor("from"));
    if (selection !== "") {
      return { selection, offset };
    } else {
      const content = this.editor.getValue();
      return { selection: content, offset: 0 };
    }
  }
  /**
   * Given a selection of text, and a query to match, return all EditorSelections of the query
   * @param  {Editor} editor
   * @param  {string} content
   * @param  {number} offset
   * @param  {string} query
   * @param  {boolean} regexQ
   * @param  {string} flags
   * @returns EditorSelectionOrCaret
   */
  getSelectionsFromQuery(
    q: Query,
    editor: Editor,
    content: string,
    offset: number
  ): EditorSelectionOrCaret[] {
    console.log({ content, offset });
    const regex = createRegex(q);

    const selections: EditorSelectionOrCaret[] = [];
    const matches = [...content.matchAll(regex)];

    matches.forEach((match) => {
      const from = match.index + offset;
      const to = from + match[0].length;

      const anchor = editor.offsetToPos(from);
      const head = editor.offsetToPos(to);

      selections.push({ anchor, head });
    });

    return selections;
  }

  submit = (q: Query, selection: string, offset: number) => {
    try {
      const selections = this.getSelectionsFromQuery(
        q,
        this.editor,
        selection,
        offset
      );

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
