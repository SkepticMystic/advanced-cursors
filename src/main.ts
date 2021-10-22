import {
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  Notice,
  Plugin,
} from "obsidian";
import { SettingTab } from "./SettingTab";
import { CursorsModal } from "./CursorsModal";
import type { SavedQuery } from "src/interfaces";

interface Settings {
  savedQueries: SavedQuery[];
}

const DEFAULT_SETTINGS: Settings = {
  savedQueries: [],
};

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

  async selectNextInstance(editor: Editor, appendQ = false) {
    const currFile = this.app.workspace.getActiveFile();
    const content = await this.app.vault.read(currFile);

    const lastSelection = editor.listSelections().last();
    const currSelection = editor.getRange(
      lastSelection.anchor,
      lastSelection.head
    );

    const currOffset = editor.posToOffset(lastSelection.head);
    const nextI = content.indexOf(currSelection, currOffset);

    console.log({ currOffset, nextI });

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
