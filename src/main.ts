import {
  App,
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  Notice,
  Platform,
  Plugin,
} from "obsidian";
import type { SavedQuery, Settings as ACSettings } from "src/interfaces";
import { CursorsModal } from "./CursorsModal";
import { ACSettingTab } from "./SettingTab";

const DEFAULT_SETTINGS: ACSettings = {
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

export default class ACPlugin extends Plugin {
  settings: ACSettings;

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
      this.addACCommand(savedQ);
    });
    this.settings.savedQueries.forEach((savedQ) => {
      this.addSelectInstanceCommand(savedQ);
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

    this.addSettingTab(new ACSettingTab(this.app, this));
  }

  addACCommand(savedQ: SavedQuery) {
    const { name, query, regexQ, flags } = savedQ;
    this.addCommand({
      id: `AC-${name} → ${query}`,
      name: `Run query: ${name} → ${query}`,
      editorCallback: async (editor: Editor) => {
        const cursorModal = new CursorsModal(this.app, editor, this);
        const { selection, offset } = await cursorModal.getSelectionAndOffset();
        cursorModal.submit(query, selection, offset, regexQ, flags);
      },
    });
  }

  addSelectInstanceCommand(savedQ: SavedQuery) {
    const { name, query, regexQ, flags } = savedQ;
    this.addCommand({
      id: `AC-next-${name} → ${query}`,
      name: `Next Instance: ${name} → ${query}`,
      editorCallback: async (editor: Editor) => {
        await this.selectNextInstance(editor, false, savedQ);
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
        const anchor = editor.offsetToPos(currRange.fromOffset);
        const head = editor.offsetToPos(currRange.toOffset);
        currSelection = editor.getRange(anchor, head);
        return {
          currSelection,
          headOffset,
          anchorOffset,
          anchor,
          head,
        };
      } else {
        throw new Error("Cannot determine if cm5 or cm6");
      }
    } catch (error) {
      console.log(error);
    }
  }

  async selectNextInstance(
    editor: Editor,
    appendQ = false,
    existingQ?: SavedQuery
  ) {
    const { currSelection, headOffset, anchorOffset, head, anchor } =
      this.getCurrSelection(editor);

    if (!editor.somethingSelected() && !existingQ) {
      console.log("selecting first ins");
      editor.setSelection(anchor, head);
      return;
    }

    const currFile = this.app.workspace.getActiveFile();
    const content = await this.app.vault.read(currFile);

    let toSelect = currSelection;
    if (existingQ) {
      toSelect = existingQ.query;
    }
    console.log({ toSelect });
    let nextI;
    if (existingQ) {
      const offset = editor.posToOffset(editor.getCursor());
      nextI = content.indexOf(existingQ.query, offset);
    } else {
      nextI = content.indexOf(toSelect, headOffset);
    }
    if (nextI > -1) {
      const editorSelection = this.createSelection(editor, nextI, toSelect);
      this.setSelections(appendQ, editor, editorSelection);
      editor.scrollIntoView({
        from: editorSelection.anchor,
        to: editorSelection.head,
      });
    } else {
      const loopedI = content.indexOf(toSelect);
      if (loopedI > -1) {
        const editorSelection = this.createSelection(editor, loopedI, toSelect);
        this.setSelections(appendQ, editor, editorSelection);
        editor.scrollIntoView({
          from: editorSelection.anchor,
          to: editorSelection.head,
        });
        new Notice(`🔁: First "${toSelect}"`);
      } else {
        new Notice(
          `Cannot find next instance of "${toSelect}" anywhere else in file.`
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
