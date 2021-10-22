import {
  App,
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  Notice,
  Platform,
  Plugin,
} from "obsidian";
import type { SavedQuery, Settings } from "src/interfaces";
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

  interface Editor {
    cm: {
      findWordAt: (pos: EditorPosition) => EditorSelection | null;
      state: {
        wordAt: (offset: number) => { fromOffset: number; toOffset: number };
      };
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
        id: `AC-${name} → ${query}`,
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

  addACCommand(savedQ: SavedQuery, app: App) {
    const { name, query, regexQ, flags } = savedQ;
    this.addCommand({
      id: `AC-${name} → ${query}`,
      name: `Run query: ${name} → ${query}`,
      editorCallback: async (editor: Editor) => {
        const cursorModal = new CursorsModal(app, editor, this);
        const { selection, offset } = await cursorModal.getSelectionAndOffset();
        cursorModal.submit(query, selection, offset, regexQ, flags);
      },
    });
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

  getCurrSelection(editor: Editor) {
    const { anchor, head } = editor.listSelections().last();
    const anchorOffset = editor.posToOffset(anchor);
    const headOffset = editor.posToOffset(head);
    let currSelection: string;

    if (!(anchor.line === head.line && anchor.ch === head.ch)) {
      const currSelection = editor.getRange(anchor, head);
      return { currSelection, headOffset, anchorOffset };
    }

    try {
      if (editor?.cm?.findWordAt) {
        const wordRange = editor.cm.findWordAt(editor.getCursor());
        const { anchor } = wordRange;
        const { head } = wordRange;
        currSelection = editor.getRange(anchor, head);

        return { currSelection, headOffset, anchorOffset, head, anchor };
      } else if (editor?.cm?.state.wordAt) {
        const currRange = editor.cm.state.wordAt(
          editor.posToOffset(editor.getCursor())
        );
        const fromPos = editor.offsetToPos(currRange.fromOffset);
        const toPos = editor.offsetToPos(currRange.toOffset);
        currSelection = editor.getRange(fromPos, toPos);
        return {
          currSelection,
          headOffset,
          anchorOffset,
          anchor: fromPos,
          head: toPos,
        };
      } else {
        throw new Error("Cannot determine if cm5 or cm6");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async selectNextInstance(editor: Editor, appendQ = false) {
    const currFile = this.app.workspace.getActiveFile();
    const content = await this.app.vault.read(currFile);

    const { currSelection, headOffset, anchorOffset, head, anchor } =
      this.getCurrSelection(editor);

    if (!editor.somethingSelected()) {
      console.log("selecting first ins");
      console.log({ anchor, head });
      editor.setSelection(anchor, head);
      return;
    }

    const nextI = content.indexOf(currSelection, headOffset);

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
        new Notice(`🔁: First "${currSelection}"`);
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
