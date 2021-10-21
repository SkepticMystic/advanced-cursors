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

    // const { selection, offset } = await this.getSelectionAndOffset();
    // console.log({ selection });

    // const inputDiv = contentEl.createDiv({ cls: "inputDiv" });

    // const inputEl = inputDiv.createEl("input", {
    //   type: "text",
    //   attr: { placeholder: "Search Query" },
    // });
    // inputEl.focus();

    // const submitButton = inputDiv.createEl(
    //   "input",
    //   {
    //     type: "submit",
    //     text: "submit",
    //   },
    //   (submitEl) => {
    //     submitEl.addEventListener("click", async () => {
    //       try {
    //         const query = inputEl.value;
    //         console.log(this.regexQ);
    //         const selections = this.getSelectionsFromQuery(
    //           selection,
    //           offset,
    //           query,
    //           this.regexQ
    //         );

    //         console.log({ selections });
    //         new Notice(`${selections.length} matches found.`);

    //         this.editor.setSelections(selections);
    //         this.close();
    //       } catch (error) {
    //         console.log(error);
    //         new Notice(
    //           "Something went wrong, check the console for the error."
    //         );
    //       }
    //     });
    //   }
    // );

    // const optionsDiv = contentEl.createDiv({ cls: "optionsDiv" });

    // optionsDiv.createEl(
    //   "input",
    //   {
    //     type: "checkbox",
    //     attr: { name: "regexQ", checked: this.regexQ },
    //   },
    //   (regexQInput) => {
    //     regexQInput.addEventListener("change", () => {
    //       this.regexQ = regexQInput.checked;
    //     });
    //   }
    // );
    // optionsDiv.createEl("label", {
    //   text: "Regex?",
    //   attr: { for: "regexQ" },
    // });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}
