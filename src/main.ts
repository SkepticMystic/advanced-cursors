import {
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  Notice,
  Plugin,
} from "obsidian";
import type { Query, Settings as ACSettings } from "src/interfaces";
import {
  cmdNextId,
  cmdNextName,
  cmdRunId,
  cmdRunName,
  createRegex,
} from "src/utils";
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
      this.addRunCmd(savedQ);
    });
    this.settings.savedQueries.forEach((savedQ) => {
      this.addNextCmd(savedQ);
    });

    this.addCommand({
      id: "move-to-next-match",
      name: "Move to next instance of current selection",
      editorCallback: (editor: Editor) => {
        this.selectNextInstance(editor);
      },
    });

    this.addCommand({
      id: "add-next-match-to-selections",
      name: "Add next instance of current selection to selections",
      editorCallback: (editor: Editor) => {
        this.selectNextInstance(editor, true);
      },
    });

    this.addSettingTab(new ACSettingTab(this.app, this));
  }

  addRunCmd(q: Query) {
    this.addCommand({
      id: cmdRunId(q),
      name: cmdRunName(q),
      editorCallback: (editor: Editor) => {
        const cursorModal = new CursorsModal(this.app, editor, this);
        const { selection, offset } = cursorModal.getSelectionAndOffset();
        cursorModal.submit(q, selection, offset);
      },
    });
  }

  addNextCmd(q: Query) {
    this.addCommand({
      id: cmdNextId(q),
      name: cmdNextName(q),
      editorCallback: (editor: Editor) => {
        this.selectNextInstance(editor, false, q);
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

  selectNextInstance(editor: Editor, appendQ = false, existingQ?: Query) {
    // TODO const q = {...existingQ || newQ}
    const { currSelection, headOffset, anchorOffset, head, anchor } =
      this.getCurrSelection(editor);

    if (!editor.somethingSelected() && !existingQ) {
      console.log("selecting first ins");
      editor.setSelection(anchor, head);
      return;
    }

    const content = editor.getValue();

    let toSelect = currSelection;
    let nextI;
    if (existingQ) {
      const offset = editor.posToOffset(editor.getCursor());

      const regex = createRegex(existingQ);
      const matches = [...content.matchAll(regex)];
      const nextMatch = matches.find((match) => match.index >= offset);
      nextI = nextMatch?.index;
      toSelect = nextMatch?.[0] ?? currSelection;
      console.log({ matches, nextI });
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
      let loopedI: number;
      if (existingQ) {
        const regex = createRegex(existingQ);
        loopedI = [...content.matchAll(regex)]?.[0]?.index;
      } else {
        loopedI = content.indexOf(toSelect);
      }

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
