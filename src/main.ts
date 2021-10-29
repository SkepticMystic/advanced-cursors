import {
  Constructor,
  Editor,
  EditorPosition,
  EditorSelection,
  EditorSelectionOrCaret,
  ItemView,
  Notice,
  Plugin,
  WorkspaceLeaf,
} from "obsidian";
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
    this.addCommand({
      id: "add-prev-match-to-selections",
      name: "Add previous instance of current selection to selections",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, true, "prev");
      },
    });

    this.addCommand({
      id: "copy-line-up",
      name: "Copy Current Line Upwards",
      editorCallback: (editor: Editor) => {
        this.copyLineUorD(editor, "up");
      },
    });

    this.addCommand({
      id: "copy-line-down",
      name: "Copy Current Line Downwards",
      editorCallback: (editor: Editor) => {
        this.copyLineUorD(editor, "down");
      },
    });

    this.registerView(
      VIEW_TYPE_AC,
      (leaf: WorkspaceLeaf) => (this.view = new SavedQView(leaf, this))
    );
    this.app.workspace.onLayoutReady(async () => {
      await this.initView(VIEW_TYPE_AC, SavedQView);
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

  linesOfSel(editor: Editor) {
    const [from, to] = [editor.getCursor("from"), editor.getCursor("to")];
    const [fromLine, toLine] = [from.line, to.line];

    const lines: string[] = [];
    for (let i = fromLine; i <= toLine; i++) {
      lines.push(editor.getLine(i));
    }
    return lines;
  }

  copyLineUorD(editor: Editor, mode: "up" | "down") {
    let [cursorFrom, cursorTo] = [
      editor.getCursor("from"),
      editor.getCursor("to"),
    ];
    const { line } = cursorTo;

    const copyLines = this.linesOfSel(editor);
    const lines = editor.getValue().split("\n");
    lines.splice(line + (mode === "up" ? 0 : 1), 0, ...copyLines);
    editor.setValue(lines.join("\n"));

    if (mode === "down") {
      cursorFrom.line += copyLines.length;
      cursorTo.line += copyLines.length;
    }
    editor.setSelection(cursorFrom, cursorTo);
    let [from, to] = [editor.getCursor("from"), editor.getCursor("to")];
    editor.scrollIntoView({ from, to });
    const { top, left } = editor.getScrollInfo();
    editor.scrollTo(left, top + window.innerHeight / 2);
  }

  matchToSel(editor: Editor, match: RegExpMatchArray) {
    const fromOff = match.index;
    const toOff = fromOff + match[0].length;

    const { line: lineA, ch: chA } = editor.offsetToPos(fromOff);
    const { line: lineH, ch: chH } = editor.offsetToPos(toOff);

    const anchor: EditorPosition = { ch: chA, line: lineA };
    const head: EditorPosition = { ch: chH, line: lineH };
    return { anchor, head };
  }

  createSel(
    editor: Editor,
    nextFromOffset: number,
    toSelect: string
  ): EditorSelection {
    const { line: lineA, ch: chA } = editor.offsetToPos(nextFromOffset);
    const { line: lineH, ch: chH } = editor.offsetToPos(
      nextFromOffset + toSelect.length
    );
    const anchor: EditorPosition = { ch: chA, line: lineA };
    const head: EditorPosition = { ch: chH, line: lineH };
    return { anchor, head };
  }

  reconstructSels(selections: EditorSelectionOrCaret[]) {
    const newSelections: EditorSelectionOrCaret[] = [];
    selections.forEach((selection) => {
      newSelections.push({
        anchor: selection.anchor,
        head: selection.head,
      });
    });
    return newSelections;
  }

  setSels(appendQ: boolean, editor: Editor, newSel: EditorSelectionOrCaret) {
    if (appendQ) {
      const currSelections: EditorSelectionOrCaret[] = editor.listSelections();

      const reconSelections = this.reconstructSels([...currSelections, newSel]);
      // reconSelections.push(newSel);
      editor.setSelections(reconSelections);
    } else {
      const reconSelections = this.reconstructSels([newSel]);
      editor.setSelections(reconSelections);
    }
  }

  getToSelect(editor: Editor): {
    toSelect: string;
    wordA: EditorPosition | undefined;
    wordH: EditorPosition | undefined;
  } {
    let toSelect, wordH: EditorPosition, wordA: EditorPosition;

    const { anchor, head } = editor.listSelections().last();
    // If last selection has something selected
    if (!(anchor.line === head.line && anchor.ch === head.ch)) {
      toSelect = editor.getRange(anchor, head);
      if (editor.posToOffset(anchor) > editor.posToOffset(head)) {
        toSelect = editor.getRange(head, anchor);
      }
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
      if (editor.posToOffset(wordA) > editor.posToOffset(wordH)) {
        return { toSelect, wordA: wordH, wordH: wordA };
      }
      return { toSelect, wordA, wordH };
    } catch (error) {
      console.log(error);
    }
  }

  isSelected(editor: Editor, selection: EditorSelection) {
    const offA = editor.posToOffset(selection.anchor);
    const offH = editor.posToOffset(selection.head);
    const matchingSels = editor
      .listSelections()
      .filter(
        (sel) =>
          editor.posToOffset(sel.anchor) === offA &&
          editor.posToOffset(sel.head) === offH
      );
    return !!matchingSels.length;
  }

  nextNotSelected(
    editor: Editor,
    matches: RegExpMatchArray[],
    fromOffset: number,
    mode: "next" | "prev"
  ) {
    if (mode === "next") {
      return (
        matches.find((m) => m.index > fromOffset) ??
        matches.find((m) => {
          const sel = this.matchToSel(editor, m);
          return m.index < fromOffset && !this.isSelected(editor, sel);
        })
      );
    } else {
      // This mode is not set up to handle the bug from #18 when adding next instance to sels
      return (
        matches.filter((m) => m.index < fromOffset).last() ??
        matches
          .filter((m) => {
            const sel = this.matchToSel(editor, m);
            return m.index > fromOffset && !this.isSelected(editor, sel);
          })
          .last()
      );
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
    let latestSel = editor.listSelections().last();
    if (mode === "prev") {
      latestSel = editor.listSelections().first();
    }
    const lastPos = latestSel[mode === "next" ? "head" : "anchor"];
    const fromOffset = editor.posToOffset(lastPos);

    const regex = createRegex(q);
    const matches = [...content.matchAll(regex)];

    let match = this.nextNotSelected(editor, matches, fromOffset, mode);
    nextFromOffset = match?.index;
    toSelect = match?.[0] ?? toSelect;

    if (nextFromOffset !== undefined) {
      const nextSel: EditorSelection = this.matchToSel(editor, match);
      // this.createSel(
      //   editor,
      //   nextFromOffset,
      //   toSelect
      // );
      this.setSels(appendQ, editor, nextSel);

      editor.scrollIntoView({
        from: nextSel.anchor,
        to: nextSel.head,
      });
    } else {
      new Notice(
        `No instance of '${toSelect}' found anywhere in note (that isn't already selected).`
      );
    }
  }

  initView = async <YourView extends ItemView>(
    type: string,
    viewClass: Constructor<YourView>
  ): Promise<void> => {
    let leaf: WorkspaceLeaf = null;
    for (leaf of this.app.workspace.getLeavesOfType(type)) {
      if (leaf.view instanceof viewClass) {
        return;
      }
      await leaf.setViewState({ type: "empty" });
      break;
    }

    (
      leaf ??
      (this.settings.savedQViewState === "right"
        ? this.app.workspace.getRightLeaf(false)
        : this.app.workspace.getLeftLeaf(false))
    ).setViewState({
      type,
      active: true,
    });
  };

  async saveViewState() {
    const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_AC)[0];
    const { side } = leaf.getRoot();
    this.settings.savedQViewState = side;
    await this.saveSettings();
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
