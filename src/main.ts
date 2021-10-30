import {
  Editor,
  EditorPosition,
  EditorSelection,
  EditorSelectionOrCaret,
  Notice,
  Plugin,
  WorkspaceLeaf,
} from "obsidian";
import { openView, saveViewSide } from "obsidian-community-lib";
import type { ACSettings as ACSettings, Mode, Query } from "src/interfaces";
import SavedQView from "src/SavedQView";
import { cmdId, cmdName, createRegex } from "src/utils";
import { DEFAULT_SETTINGS, MODES, VIEW_TYPE_AC } from "./const";
import { CursorsModal } from "./CursorsModal";
import { ACSettingTab } from "./SettingTab";

export default class ACPlugin extends Plugin {
  settings: ACSettings;
  view: SavedQView;

  async onload() {
    console.log("Loading advanced cursors");

    await this.loadSettings();

    // SECTION Commands
    this.addCommand({
      id: "open-regex-match-modal",
      name: "Open Regex Match Modal",
      editorCallback: (editor: Editor) => {
        new CursorsModal(this.app, editor, this).open();
      },
    });

    this.settings.savedQueries.forEach((q) => {
      MODES.forEach((mode) => this.addCmd(q, mode));
    });

    // SECTION Move to MODE match
    this.addCommand({
      id: "move-to-next-match",
      name: "Move to next instance of current selection",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, "Next");
      },
    });
    this.addCommand({
      id: "move-to-previous-match",
      name: "Move to previous instance of current selection",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, "Prev");
      },
    });
    // !SECTION Move to MODE match

    // SECTION Add MODE match to selections
    this.addCommand({
      id: "add-next-match-to-selections",
      name: "Add next instance of current selection to selections",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, true, "Next");
      },
    });
    this.addCommand({
      id: "add-prev-match-to-selections",
      name: "Add previous instance of current selection to selections",
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, true, "Prev");
      },
    });
    // !SECTION Add MODE match to selections

    // SECTION Copy Lines
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
    // !SECTION Copy Lines
    // !SECTION Commands

    this.registerView(
      VIEW_TYPE_AC,
      (leaf: WorkspaceLeaf) => (this.view = new SavedQView(leaf, this))
    );
    this.app.workspace.onLayoutReady(async () => {
      await openView(
        this.app,
        VIEW_TYPE_AC,
        SavedQView,
        this.settings.savedQViewSide
      );
    });

    this.addSettingTab(new ACSettingTab(this.app, this));
  }

  addCmd(q: Query, mode: Mode) {
    this.addCommand({
      id: cmdId(q, mode),
      name: cmdName(q, mode),
      editorCallback: (editor: Editor) => {
        this.selectInstance(editor, false, mode, q);
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
    // @ts-ignore
    const { top, left, clientHeight } = editor.getScrollInfo();
    editor.scrollTo(left, top + clientHeight / 2);
  }

  matchToSel(editor: Editor, match: RegExpMatchArray, offset = 0) {
    const fromOff = match.index + offset;
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

  setSels(
    appendQ: boolean,
    editor: Editor,
    ...newSels: EditorSelectionOrCaret[]
  ) {
    if (appendQ) {
      const currSelections: EditorSelectionOrCaret[] = editor.listSelections();

      const reconSelections = this.reconstructSels([
        ...currSelections,
        ...newSels,
      ]);
      editor.setSelections(reconSelections);
    } else {
      const reconSelections = this.reconstructSels([...newSels]);
      editor.setSelections(reconSelections);
    }
    this.clearOldSetNewMSpan(editor, ...newSels);
  }

  clearOldSetNewMSpan(editor: Editor, ...newSels: EditorSelectionOrCaret[]) {
    const doc = editor.cm.getDoc();
    // Clear old
    const { lines } = doc.children[0];
    lines.forEach((l) => {
      l?.markedSpans?.forEach((mSpan) => mSpan.marker.clear());
    });

    // Set new
    newSels.forEach((newSel) => {
      if (this.anchorAheadOfHead(editor, newSel)) {
        doc.markText(newSel.head, newSel.anchor, {
          className: "AC-flashNewSel",
        });
      } else {
        doc.markText(newSel.anchor, newSel.head, {
          className: "AC-flashNewSel",
        });
      }
    });
  }

  anchorAheadOfHead(
    editor: Editor,
    sel: EditorSelection | EditorSelectionOrCaret
  ) {
    return editor.posToOffset(sel.anchor) > editor.posToOffset(sel.head);
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
      if (this.anchorAheadOfHead(editor, { anchor: wordA, head: wordH })) {
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
    mode: Mode
  ) {
    if (mode === "Next") {
      return (
        matches.find((m) => m.index > fromOffset) ??
        matches.find((m) => {
          const sel = this.matchToSel(editor, m);
          return m.index < fromOffset && !this.isSelected(editor, sel);
        })
      );
    } else if (mode === "Prev") {
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
    mode: Mode,
    existingQ?: Query
  ) {
    // const {setSelection, getValue, somethingSelected, posToOffset, getCursor, listSelections, scrollIntoView} = editor
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

    let content = editor.getValue();
    const regex = createRegex(q);
    let matches = [...content.matchAll(regex)];

    const nextSels: EditorSelection[] = [];
    if (mode === "All") {
      let offset = 0;
      if (editor.somethingSelected()) {
        offset = editor.posToOffset(editor.getCursor("from"));
        content = editor.getSelection();
        matches = [...content.matchAll(regex)];
      }
      matches.forEach((m) => {
        nextSels.push(this.matchToSel(editor, m, offset));
      });
      this.setSels(appendQ, editor, ...nextSels);
      new Notice(`${matches.length} matches found.`);
      return;
    }

    let nextFromOffset;
    let latestSel = editor.listSelections().last();
    if (mode === "Prev") {
      latestSel = editor.listSelections().first();
    }
    const lastPos = latestSel[mode === "Next" ? "head" : "anchor"];
    const fromOffset = editor.posToOffset(lastPos);

    let match = this.nextNotSelected(editor, matches, fromOffset, mode);
    nextFromOffset = match?.index;
    toSelect = match?.[0] ?? toSelect;

    if (nextFromOffset !== undefined) {
      const nextSel: EditorSelection = this.matchToSel(editor, match);
      nextSels.push(nextSel);

      this.setSels(appendQ, editor, ...nextSels);

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

  async onunload() {
    await saveViewSide(this.app, this, VIEW_TYPE_AC, "savedQViewSide");
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_AC);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
