import {
  Editor,
  EditorPosition,
  EditorSelection,
  EditorSelectionOrCaret,
  Notice,
  Plugin,
  TextMarker,
  WorkspaceLeaf,
} from "obsidian";
import { openView, saveViewSide } from "obsidian-community-lib";
import { IncrementingIModal } from "src/IncrementingIModal";
import type { ACSettings as ACSettings, Mode, Query } from "src/interfaces";
import SavedQView from "src/SavedQView";
import { blankQ, cmdId, cmdName, createRegex, roundNumber } from "src/utils";
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
      editorCallback: (ed) => new CursorsModal(this.app, ed, this).open(),
    });

    this.settings.savedQueries.forEach((q) => {
      MODES.forEach((mode) => this.addCmd(q, mode));
    });

    // SECTION Move to MODE match
    this.addCommand({
      id: "move-to-next-match",
      name: "Move to next instance of current selection",
      editorCallback: (ed) => this.selectInstance(ed, false, "Next"),
    });
    this.addCommand({
      id: "move-to-previous-match",
      name: "Move to previous instance of current selection",
      editorCallback: (ed) => this.selectInstance(ed, false, "Prev"),
    });
    // !SECTION Move to MODE match

    // SECTION Add MODE match to selections
    this.addCommand({
      id: "add-next-match-to-selections",
      name: "Add next instance of current selection to selections",
      editorCallback: (ed) => this.selectInstance(ed, true, "Next"),
    });
    this.addCommand({
      id: "add-prev-match-to-selections",
      name: "Add previous instance of current selection to selections",
      editorCallback: (ed) => this.selectInstance(ed, true, "Prev"),
    });
    // !SECTION Add MODE match to selections

    // SECTION Copy Lines
    this.addCommand({
      id: "copy-line-up",
      name: "Copy Current Line Upwards",
      editorCallback: (ed) => this.copyLineUorD(ed, "up"),
    });
    this.addCommand({
      id: "copy-line-down",
      name: "Copy Current Line Downwards",
      editorCallback: (ed) => this.copyLineUorD(ed, "down"),
    });
    // !SECTION Copy Lines

    this.addCommand({
      id: "add-cursor-above",
      name: "Add a cursor on the line above",
      editorCallback: (ed) => this.addCursorUpOrDown(ed, "up"),
    });
    this.addCommand({
      id: "add-cursor-below",
      name: "Add a cursor on the line below",
      editorCallback: (ed) => this.addCursorUpOrDown(ed, "down"),
    });

    this.addCommand({
      id: "write-incrementing-i",
      name: "Insert an incrementing value at each cursor",
      editorCallback: (ed) => {
        new IncrementingIModal(this.app, this, ed).open();
      },
    });

    this.addCommand({
      id: "open-savedQ-view",
      name: "Open Saved Query View",
      callback: async () => {
        await openView(
          this.app,
          VIEW_TYPE_AC,
          SavedQView,
          this.settings.savedQViewSide
        );
      },
    });

    // !SECTION Commands

    this.registerView(
      VIEW_TYPE_AC,
      (leaf: WorkspaceLeaf) => (this.view = new SavedQView(leaf, this))
    );
    this.app.workspace.onLayoutReady(async () => {
      if (this.settings.openViewOnload) {
        await openView(
          this.app,
          VIEW_TYPE_AC,
          SavedQView,
          this.settings.savedQViewSide
        );
      }
    });

    this.addSettingTab(new ACSettingTab(this.app, this));
  }

  addCmd(q: Query, mode: Mode) {
    this.addCommand({
      id: cmdId(q, mode),
      name: cmdName(q, mode),
      editorCallback: (ed: Editor) => {
        this.selectInstance(ed, false, mode, q);
      },
    });
  }

  linesOfSel(ed: Editor) {
    const [from, to] = [ed.getCursor("from"), ed.getCursor("to")];
    const [fromLine, toLine] = [from.line, to.line];

    const lines: string[] = [];
    for (let i = fromLine; i <= toLine; i++) {
      lines.push(ed.getLine(i));
    }
    return lines;
  }

  scrollNicely(ed: Editor, sel: EditorSelection) {
    const [A, H] = [sel.anchor, sel.head];
    const lastLine = ed.lastLine();

    const aLine = A.line >= 1 ? A.line - 1 : A.line;
    const hLine = H.line <= lastLine - 1 ? H.line + 1 : H.line;

    ed.scrollIntoView({
      from: { line: aLine, ch: A.ch },
      to: { line: hLine, ch: H.ch },
    });
  }

  copyLineUorD(ed: Editor, mode: "up" | "down") {
    let [cursorFrom, cursorTo] = [ed.getCursor("from"), ed.getCursor("to")];
    const { line } = cursorTo;

    const copyLines = this.linesOfSel(ed);
    const lines = ed.getValue().split("\n");
    lines.splice(line + (mode === "up" ? 0 : 1), 0, ...copyLines);
    ed.setValue(lines.join("\n"));

    if (mode === "down") {
      cursorFrom.line += copyLines.length;
      cursorTo.line += copyLines.length;
    }

    ed.setSelection(cursorFrom, cursorTo);
    this.scrollNicely(ed, { anchor: cursorFrom, head: cursorTo });
  }

  addCursorUpOrDown(ed: Editor, mode: "up" | "down") {
    const sels: EditorSelectionOrCaret[] = ed.listSelections();
    const { ch, line } = sels[mode === "up" ? "first" : "last"]().anchor;

    const lineTo = line + (mode === "up" ? -1 : 1);
    const chTo = Math.min(ch, ed.getLine(lineTo).length);

    const anchor = {
      line: lineTo,
      ch: chTo,
    };
    sels.push({ anchor, head: anchor });
    ed.setSelections(this.reconstructSels(sels));
  }

  matchToSel(ed: Editor, match: RegExpMatchArray, offset = 0): EditorSelection {
    const fromOff = match.index + offset;
    const toOff = fromOff + match[0].length;

    const { line: lineA, ch: chA } = ed.offsetToPos(fromOff);
    const { line: lineH, ch: chH } = ed.offsetToPos(toOff);

    const anchor: EditorPosition = { ch: chA, line: lineA };
    const head: EditorPosition = { ch: chH, line: lineH };
    return { anchor, head };
  }

  reconstructSels(sels: EditorSelectionOrCaret[]) {
    return sels.map((sel) => {
      const { anchor, head } = sel;
      return { anchor, head };
    });
  }

  setSels(appendQ: boolean, ed: Editor, ...newSels: EditorSelectionOrCaret[]) {
    if (appendQ) {
      const currSelections: EditorSelectionOrCaret[] = ed.listSelections();

      const reconSelections = this.reconstructSels([
        ...currSelections,
        ...newSels,
      ]);
      ed.setSelections(reconSelections);
    } else {
      const reconSelections = this.reconstructSels([...newSels]);
      ed.setSelections(reconSelections);
    }
    // FIX doesn't work with CM6, I have to create a mark decorator
    // this.clearOldSetNewMSpan(ed, ...newSels);
  }

  clearOldSetNewMSpan(ed: Editor, ...newSels: EditorSelectionOrCaret[]) {
    const doc = ed.cm.getDoc();
    // Clear old
    const { lines } = doc.children[0];
    lines.forEach((l) => {
      l?.markedSpans?.forEach((mSpan) => mSpan.marker.clear());
    });

    // Set new
    newSels.forEach((newSel) => {
      let marker: TextMarker;
      if (this.anchorAheadOfHead(ed, newSel)) {
        marker = doc.markText(newSel.head, newSel.anchor, {
          className: "AC-flashNewSel",
        });
      } else {
        marker = doc.markText(newSel.anchor, newSel.head, {
          className: "AC-flashNewSel",
        });
      }

      setTimeout(() => {
        marker.clear();
      }, 1000);
    });
  }

  anchorAheadOfHead(ed: Editor, sel: EditorSelection | EditorSelectionOrCaret) {
    return ed.posToOffset(sel.anchor) > ed.posToOffset(sel.head);
  }

  getToSelect(ed: Editor): {
    toSelect: string;
    wordA: EditorPosition | undefined;
    wordH: EditorPosition | undefined;
  } {
    let toSelect: string, wordH: EditorPosition, wordA: EditorPosition;

    const { anchor, head } = ed.listSelections().last();
    // If last selection has something selected
    if (!(anchor.line === head.line && anchor.ch === head.ch)) {
      toSelect =
        ed.posToOffset(anchor) < ed.posToOffset(head)
          ? ed.getRange(anchor, head)
          : ed.getRange(head, anchor);
      return { toSelect, wordA, wordH };
    }

    try {
      const cursor = ed.getCursor();
      if (ed.cm?.findWordAt) {
        // CM5
        const wordRange = ed.cm.findWordAt(cursor);
        [wordA, wordH] = [wordRange.anchor, wordRange.head];
        toSelect = ed.getRange(wordA, wordH);
      } else if (ed.cm?.viewState.state.wordAt) {
        // CM6
        const cursorOff = ed.posToOffset(cursor);
        const word = ed.cm.viewState.state.wordAt(cursorOff);
        if (word !== null) {
          const { from, to } = ed.cm?.viewState.state.wordAt(
            ed.posToOffset(cursor)
          );
          [wordA, wordH] = [ed.offsetToPos(from), ed.offsetToPos(to)];
          toSelect = ed.getRange(wordA, wordH);
        } else {
          const { length } = ed.getValue();
          if (length === 0) {
            // Empty doc
            const start = { line: 0, ch: 0 };
            return { toSelect: "", wordA: start, wordH: start };
          } else if (cursorOff < length) {
            [wordA, wordH] = [cursor, ed.offsetToPos(cursorOff + 1)];
            toSelect = ed.getRange(wordA, wordH);
          } else {
            // cursor at end of document
            [wordA, wordH] = [ed.offsetToPos(cursorOff - 1), cursor];
            toSelect = ed.getRange(wordA, wordH);
          }
        }
      } else {
        throw new Error("Cannot determine if cm5 or cm6");
      }
      if (this.anchorAheadOfHead(ed, { anchor: wordA, head: wordH })) {
        return { toSelect, wordA: wordH, wordH: wordA };
      }
      return { toSelect, wordA, wordH };
    } catch (error) {
      console.log(error);
    }
  }

  isSelected(ed: Editor, selection: EditorSelection) {
    const [offA, offH] = [
      ed.posToOffset(selection.anchor),
      ed.posToOffset(selection.head),
    ];
    const matchingSels = ed
      .listSelections()
      .filter(
        (sel) =>
          ed.posToOffset(sel.anchor) === offA &&
          ed.posToOffset(sel.head) === offH
      );
    return !!matchingSels.length;
  }

  nextNotSelected(
    ed: Editor,
    matches: RegExpMatchArray[],
    fromOffset: number,
    mode: Mode
  ) {
    if (mode === "Next") {
      return (
        matches.find((m) => m.index > fromOffset) ??
        matches.find((m) => {
          const sel = this.matchToSel(ed, m);
          return m.index < fromOffset && !this.isSelected(ed, sel);
        })
      );
    } else if (mode === "Prev") {
      return (
        matches.filter((m) => m.index < fromOffset).last() ??
        matches
          .filter((m) => {
            const sel = this.matchToSel(ed, m);
            return m.index > fromOffset && !this.isSelected(ed, sel);
          })
          .last()
      );
    }
  }

  selectInstance(ed: Editor, appendQ = false, mode: Mode, existingQ?: Query) {
    let { toSelect, wordA, wordH } = this.getToSelect(ed);
    // Set words under cursor
    if (!ed.somethingSelected() && !existingQ) {
      ed.setSelection(wordA, wordH);
      return;
    }

    let q = existingQ ?? blankQ(toSelect, false);

    let content = ed.getValue();
    const regex = createRegex(q);
    let matches = [...content.matchAll(regex)];

    if (mode === "All") {
      let offset = 0;
      if (ed.somethingSelected()) {
        offset = ed.posToOffset(ed.getCursor("from"));
        const currSel = ed.getSelection();
        matches = [...currSel.matchAll(regex)];
      }
      const nextSels = matches.map((m) => this.matchToSel(ed, m, offset));
      this.setSels(appendQ, ed, ...nextSels);
      this.settings.showFunctionNotifications &&
        new Notice(`${matches.length} matches found.`);
      return;
    }

    let latestSel =
      mode === "Next"
        ? ed.listSelections().last()
        : ed.listSelections().first();

    const lastPos = latestSel[mode === "Next" ? "head" : "anchor"];
    const fromOffset = ed.posToOffset(lastPos);

    const match = this.nextNotSelected(ed, matches, fromOffset, mode);
    const nextFromOffset = match?.index;
    toSelect = match?.[0] ?? toSelect;

    if (nextFromOffset !== undefined) {
      const nextSel = this.matchToSel(ed, match);
      this.setSels(appendQ, ed, nextSel);
      this.scrollNicely(ed, nextSel);
    } else {
      this.settings.showFunctionNotifications &&
        new Notice(
          `No instance of '${toSelect}' found anywhere in note (that isn't already selected).`
        );
    }
  }

  writeIncrementingI(ed: Editor, start: number, inc: number) {
    const sels = ed.listSelections();
    sels.forEach((sel, n) => {
      const i = roundNumber(start + n * inc).toString();
      if (!this.anchorAheadOfHead(ed, sel)) {
        ed.replaceRange(i, sel.anchor, sel.head);
      } else {
        ed.replaceRange(i, sel.head, sel.anchor);
      }
    });
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
