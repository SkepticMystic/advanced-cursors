import {
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  Notice,
  Plugin,
} from "obsidian";
import type { Settings } from "src/interfaces";
import { CursorsModal } from "./CursorsModal";
import { SettingTab } from "./SettingTab";

const DEFAULT_SETTINGS: Settings = {
  savedQueries: [],
};

declare module "obsidian" {
  interface App {
    commands: {
      removeCommand: (id: string) => unknown;
    };
  }
}

export default class MyPlugin extends Plugin {
  settings: Settings;

  async onload() {
    console.log("Loading advanced cursors");

    await this.loadSettings();

    this.addCommand({
      id: "open-regex-match-modal",
      name: "Open Regex Match Modal",
      editorCallback: (editor: Editor) => {
        new CursorsModal(this.app, editor, this).open();
      },
    });

    this.settings.savedQueries.forEach((savedQ) => {
      const { name, query } = savedQ;
      this.addCommand({
        id: `AC-${name}: ${query}`,
        name: `Run query: ${name} → ${query}`,
        editorCallback: async (editor: Editor) => {
          const cursorModal = new CursorsModal(this.app, editor, this);
          const { selection, offset } =
            await cursorModal.getSelectionAndOffset();
          cursorModal.submit(
            query,
            selection,
            offset,
            savedQ.regexQ,
            savedQ.flags
          );
        },
      });
    });

    this.addCommand({
      id: "move-to-next-match",
      name: "Move to next instance of current selection",
      editorCallback: async (editor: Editor) => {
        this.selectNextInstance(editor);
      },
    });

    this.addCommand({
      id: "add-next-match-to-selections",
      name: "Add next instance of current selection to selections",
      editorCallback: async (editor: Editor) => {
        this.selectNextInstance(editor, true);
      },
    });

    this.addSettingTab(new SettingTab(this.app, this));
  }

  createSelection(
    editor: Editor,
    nextI: number,
    currSelection: string
  ): EditorSelectionOrCaret {
    const { line, ch } = editor.offsetToPos(nextI);
    const anchor: EditorPosition = {
      ch,
      line,
    };
    const head: EditorPosition = {
      ch: ch + currSelection.length,
      line,
    };
    return { anchor, head };
  }

  reconstructCurrentSelections(selections: EditorSelectionOrCaret[]) {
    const newSelections: EditorSelectionOrCaret[] = [];
    selections.forEach((selection) => {
      newSelections.push({
        anchor: selection.anchor,
        head: selection.head,
      });
    });
    return newSelections;
  }

  setSelections(
    appendQ: boolean,
    editor: Editor,
    editorSelection: EditorSelectionOrCaret
  ) {
    if (appendQ) {
      const currSelections: EditorSelectionOrCaret[] = editor.listSelections();

      const reconstructedSelections =
        this.reconstructCurrentSelections(currSelections);
      reconstructedSelections.push(editorSelection);
      editor.setSelections(reconstructedSelections);
    } else {
      editor.setSelections([editorSelection]);
    }
  }

  getCurrSelection(editor: Editor, content: string) {
    const { anchor, head } = editor.listSelections().last();

    if (!(anchor.line === head.line && anchor.ch === head.ch)) {
      const currSelection = editor.getRange(anchor, head);
      const currOffset = editor.posToOffset(head);
      return { currSelection, currOffset };
    }

    const currOffset = editor.posToOffset(editor.getCursor("from"));
    const stops = new RegExp(/\b/g);

    // Go forward till stop
    let [fwdWord, nextF, iF] = ["", "", 0];
    while (true) {
      nextF = content[currOffset + iF];
      iF++;
      if (nextF?.match(stops)) {
        fwdWord += nextF;
      } else break;
    }

    // Go backward till stop
    let [backWord, nextB, iB] = ["", "", 1];
    while (true) {
      nextB = content[currOffset - iB];
      iB++;
      if (nextB?.match(stops)) {
        backWord += nextB;
      } else break;
    }

    const reversedBackWord = backWord.split("").reverse().join("");
    const currSelection = reversedBackWord + fwdWord;
    console.log({ currSelection });

    return { currSelection, currOffset };
  }

  async selectNextInstance(editor: Editor, appendQ = false) {
    const currFile = this.app.workspace.getActiveFile();
    const content = await this.app.vault.read(currFile);

    const { currSelection, currOffset } = this.getCurrSelection(
      editor,
      content
    );

    const nextI = content.indexOf(currSelection, currOffset);

    console.log({ currSelection, currOffset, nextI });

    if (nextI > -1) {
      const editorSelection = this.createSelection(
        editor,
        nextI,
        currSelection
      );
      this.setSelections(appendQ, editor, editorSelection);
    } else {
      const loopedI = content.indexOf(currSelection);
      if (loopedI > -1) {
        const editorSelection = this.createSelection(
          editor,
          loopedI,
          currSelection
        );
        this.setSelections(appendQ, editor, editorSelection);
        new Notice(
          `Cannot find next instance of "${currSelection}", looping back to start.`
        );
      } else {
        new Notice(
          `Cannot find next instance of "${currSelection}" anywhere else in file.`
        );
      }
    }
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
