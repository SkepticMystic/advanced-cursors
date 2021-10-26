import {
  Editor,
  EditorPosition,
  EditorSelectionOrCaret,
  ItemView,
  Notice,
  Plugin,
  WorkspaceLeaf,
} from "obsidian";
import { addFeatherIcon } from "obsidian-community-lib";
import type { ACSettings as ACSettings, Query } from "src/interfaces";
import SavedQView from "src/SavedQView";
import {
  cmdNextId,
  cmdNextName,
  cmdPrevId,
  cmdPrevName,
  cmdRunId,
  cmdRunName,
  createRegex,
} from "src/utils";
import { DEFAULT_SETTINGS, VIEW_TYPE_AC } from "./const";
import { CursorsModal } from "./CursorsModal";
import { ACSettingTab } from "./SettingTab";

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

  interface WorkspaceItem {
    side: "left" | "right";
  }
}

export default class ACPlugin extends Plugin {
  settings: ACSettings;
  view: SavedQView;

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

    this.settings.savedQueries.forEach((q) => {
      this.addRunCmd(q);
      this.addNextCmd(q);
      this.addPrevCmd(q);
    });

    this.addCommand({
      id: "move-to-next-match",
      name: "Move to next instance of current selection",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, "next");
      },
    });
    this.addCommand({
      id: "move-to-previous-match",
      name: "Move to previous instance of current selection",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, "prev");
      },
    });

    this.addCommand({
      id: "add-next-match-to-selections",
      name: "Add next instance of current selection to selections",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, true, "next");
      },
    });

    addFeatherIcon("mouse-pointer");

    this.app.workspace.onLayoutReady(async () => {
      this.registerView(
        VIEW_TYPE_AC,
        (leaf: WorkspaceLeaf) => (this.view = new SavedQView(leaf, this))
      );
      await this.initView(VIEW_TYPE_AC);
    });

    this.addSettingTab(new ACSettingTab(this.app, this));
  }

  addRunCmd(q: Query) {
    this.addCommand({
      id: cmdRunId(q),
      name: cmdRunName(q),
      editorCallback: (editor: Editor) => {
        const cursorModal = new CursorsModal(this.app, editor, this);
        cursorModal.submit(q);
      },
    });
  }

  addNextCmd(q: Query) {
    this.addCommand({
      id: cmdNextId(q),
      name: cmdNextName(q),
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, "next", q);
      },
    });
  }

  addPrevCmd(q: Query) {
    this.addCommand({
      id: cmdPrevId(q),
      name: cmdPrevName(q),
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, "prev", q);
      },
    });
  }

  createSelection(
    editor: Editor,
    nextFromOffset: number,
    toSelect: string
  ): EditorSelectionOrCaret {
    const { line: lineA, ch: chA } = editor.offsetToPos(nextFromOffset);
    const { line: lineH, ch: chH } = editor.offsetToPos(
      nextFromOffset + toSelect.length
    );
    const anchor: EditorPosition = { ch: chA, line: lineA };
    const head: EditorPosition = { ch: chH, line: lineH };
    return { anchor, head };
  }

  reconstructSelections(selections: EditorSelectionOrCaret[]) {
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

      const reconSelections = this.reconstructSelections(currSelections);
      reconSelections.push(editorSelection);
      editor.setSelections(reconSelections);
    } else {
      editor.setSelections([editorSelection]);
    }
  }

  getToSelect(editor: Editor): {
    toSelect: string;
    wordA: EditorPosition | undefined;
    wordH: EditorPosition | undefined;
  } {
    let toSelect, wordH: EditorPosition, wordA: EditorPosition;

    const { anchor, head } = editor.listSelections().last();
    if (!(anchor.line === head.line && anchor.ch === head.ch)) {
      toSelect = editor.getRange(anchor, head);
      return { toSelect, wordA, wordH };
    }

    try {
      const cursor = editor.getCursor();
      if (editor.cm?.findWordAt) {
        const wordRange = editor.cm.findWordAt(cursor);
        [wordA, wordH] = [wordRange.anchor, wordRange.head];
        toSelect = editor.getRange(wordA, wordH);
      } else if (editor.cm?.state.wordAt) {
        const { fromOffset, toOffset } = editor.cm.state.wordAt(
          editor.posToOffset(cursor)
        );
        [wordA, wordH] = [
          editor.offsetToPos(fromOffset),
          editor.offsetToPos(toOffset),
        ];
        toSelect = editor.getRange(wordA, wordH);
      } else {
        throw new Error("Cannot determine if cm5 or cm6");
      }
      return { toSelect, wordA, wordH };
    } catch (error) {
      console.log(error);
    }
  }

  selectInstance(
    editor: Editor,
    appendQ = false,
    mode: "prev" | "next",
    existingQ?: Query
  ) {
    let { toSelect, wordA, wordH } = this.getToSelect(editor);

    // Set words under cursor
    if (!editor.somethingSelected() && !existingQ) {
      editor.setSelection(wordA, wordH);
      return;
    }

    let q = existingQ;
    if (!existingQ) {
      q = { name: "", query: toSelect, flags: "", regexQ: false };
    }

    const content = editor.getValue();
    let nextFromOffset;
    const fromOffset = editor.posToOffset(
      editor.listSelections().last()[mode === "next" ? "head" : "anchor"]
    );

    const regex = createRegex(q);
    const matches = [...content.matchAll(regex)];

    let match;
    if (mode === "next") {
      match = matches.find((m) => m.index >= fromOffset) ?? matches[0];
    } else {
      match =
        matches.filter((m) => m.index < fromOffset).last() ?? matches.last();
    }
    nextFromOffset = match?.index;
    console.log({ matches, match, nextFromOffset });
    toSelect = match?.[0] ?? toSelect;

    if (nextFromOffset !== undefined) {
      const editorSel = this.createSelection(editor, nextFromOffset, toSelect);
      console.log({ editorSel });
      this.setSelections(appendQ, editor, editorSel);
      editor.scrollIntoView({
        from: editorSel.anchor,
        to: editorSel.head,
      });
    } else {
      new Notice(`No instance of '${toSelect}' found anywhere in note.`);
    }
  }

  initView = async <YourView extends ItemView>(
    type: string
    // viewClass: Constructor<YourView>
  ): Promise<void> => {
    let leaf: WorkspaceLeaf = null;
    for (leaf of this.app.workspace.getLeavesOfType(type)) {
      if (leaf.view instanceof SavedQView) {
        return;
      }
      await leaf.setViewState({ type: "empty" });
      break;
    }

    (
      leaf ??
      (this.settings.savedQViewState.side === "right"
        ? this.app.workspace.getRightLeaf(false)
        : this.app.workspace.getLeftLeaf(false))
    ).setViewState({
      type,
      active: true,
    });
  };

  // instanceQ<I extends View>(ins: I, thing: any) {
  //   if (thing instanceof ins) {
  //   }
  // }

  async saveViewState() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_AC)[0];
    const item = leaf.getRoot();
    const { side } = item;
    this.settings.savedQViewState = { side };
    await this.saveSettings();
    console.log({ item, side, savedSide: this.settings.savedQViewState.side });
  }

  async onunload() {
    await this.saveViewState();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_AC);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
