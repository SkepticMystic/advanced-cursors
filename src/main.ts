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
      editorCallback: (ed: Editor) => {
        new CursorsModal(this.app, ed, this).open();
      },
    });

    this.settings.savedQueries.forEach((q) => {
      MODES.forEach((mode) => this.addCmd(q, mode));
    });

    // SECTION Move to MODE match
    this.addCommand({
      id: "move-to-next-match",
      name: "Move to next instance of current selection",
      editorCallback: (ed: Editor) => {
        this.selectInstance(ed, false, "Next");
      },
    });
    this.addCommand({
      id: "move-to-previous-match",
      name: "Move to previous instance of current selection",
      editorCallback: (ed: Editor) => {
        this.selectInstance(ed, false, "Prev");
      },
    });
    // !SECTION Move to MODE match

    // SECTION Add MODE match to selections
    this.addCommand({
      id: "add-next-match-to-selections",
      name: "Add next instance of current selection to selections",
      editorCallback: (ed: Editor) => {
        this.selectInstance(ed, true, "Next");
      },
    });
    this.addCommand({
      id: "add-prev-match-to-selections",
      name: "Add previous instance of current selection to selections",
      editorCallback: (ed: Editor) => {
        this.selectInstance(ed, true, "Prev");
      },
    });
    // !SECTION Add MODE match to selections

    // SECTION Copy Lines
    this.addCommand({
      id: "copy-line-up",
      name: "Copy Current Line Upwards",
      editorCallback: (ed: Editor) => {
        this.copyLineUorD(ed, "up");
      },
    });

    this.addCommand({
      id: "copy-line-down",
      name: "Copy Current Line Downwards",
      editorCallback: (ed: Editor) => {
        this.copyLineUorD(ed, "down");
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
    // @ts-ignore
    const { top, left, clientHeight } = ed.getScrollInfo();
    ed.scrollTo(left, top + clientHeight / 2);
  }

  matchToSel(ed: Editor, match: RegExpMatchArray, offset = 0) {
    const fromOff = match.index + offset;
    const toOff = fromOff + match[0].length;

    const { line: lineA, ch: chA } = ed.offsetToPos(fromOff);
    const { line: lineH, ch: chH } = ed.offsetToPos(toOff);

    const anchor: EditorPosition = { ch: chA, line: lineA };
    const head: EditorPosition = { ch: chH, line: lineH };
    return { anchor, head };
  }

  // createSel(
  //   editor: Editor,
  //   nextFromOffset: number,
  //   toSelect: string
  // ): EditorSelection {
  //   const { line: lineA, ch: chA } = editor.offsetToPos(nextFromOffset);
  //   const { line: lineH, ch: chH } = editor.offsetToPos(
  //     nextFromOffset + toSelect.length
  //   );
  //   const anchor: EditorPosition = { ch: chA, line: lineA };
  //   const head: EditorPosition = { ch: chH, line: lineH };
  //   return { anchor, head };
  // }

  reconstructSels(sels: EditorSelectionOrCaret[]) {
    return sels.map((sel) => {
      return { anchor: sel.anchor, head: sel.head };
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
    this.clearOldSetNewMSpan(ed, ...newSels);
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
      if (this.anchorAheadOfHead(ed, newSel)) {
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

  anchorAheadOfHead(ed: Editor, sel: EditorSelection | EditorSelectionOrCaret) {
    return ed.posToOffset(sel.anchor) > ed.posToOffset(sel.head);
  }

  getToSelect(ed: Editor): {
    toSelect: string;
    wordA: EditorPosition | undefined;
    wordH: EditorPosition | undefined;
  } {
    let toSelect, wordH: EditorPosition, wordA: EditorPosition;

    const { anchor, head } = ed.listSelections().last();
    // If last selection has something selected
    if (!(anchor.line === head.line && anchor.ch === head.ch)) {
      toSelect = ed.getRange(anchor, head);
      if (ed.posToOffset(anchor) > ed.posToOffset(head)) {
        toSelect = ed.getRange(head, anchor);
      }
      return { toSelect, wordA, wordH };
    }

    try {
      const cursor = ed.getCursor();
      if (ed.cm?.findWordAt) {
        const wordRange = ed.cm.findWordAt(cursor);
        [wordA, wordH] = [wordRange.anchor, wordRange.head];
        toSelect = ed.getRange(wordA, wordH);
      } else if (ed.cm?.state.wordAt) {
        const { fromOffset, toOffset } = ed.cm.state.wordAt(
          ed.posToOffset(cursor)
        );
        [wordA, wordH] = [ed.offsetToPos(fromOffset), ed.offsetToPos(toOffset)];
        toSelect = ed.getRange(wordA, wordH);
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
    const offA = ed.posToOffset(selection.anchor);
    const offH = ed.posToOffset(selection.head);
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
      // This mode is not set up to handle the bug from #18 when adding next instance to sels
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

    let q = existingQ;
    if (!existingQ) {
      q = { name: "", query: toSelect, flags: "", regexQ: false };
    }

    let content = ed.getValue();
    const regex = createRegex(q);
    let matches = [...content.matchAll(regex)];

    const nextSels: EditorSelection[] = [];
    if (mode === "All") {
      let offset = 0;
      if (ed.somethingSelected()) {
        offset = ed.posToOffset(ed.getCursor("from"));
        content = ed.getSelection();
        matches = [...content.matchAll(regex)];
      }
      matches.forEach((m) => {
        nextSels.push(this.matchToSel(ed, m, offset));
      });
      this.setSels(appendQ, ed, ...nextSels);
      new Notice(`${matches.length} matches found.`);
      return;
    }

    let nextFromOffset;
    let latestSel = ed.listSelections().last();
    if (mode === "Prev") {
      latestSel = ed.listSelections().first();
    }
    const lastPos = latestSel[mode === "Next" ? "head" : "anchor"];
    const fromOffset = ed.posToOffset(lastPos);

    let match = this.nextNotSelected(ed, matches, fromOffset, mode);
    nextFromOffset = match?.index;
    toSelect = match?.[0] ?? toSelect;

    if (nextFromOffset !== undefined) {
      const nextSel: EditorSelection = this.matchToSel(ed, match);
      nextSels.push(nextSel);

      this.setSels(appendQ, ed, ...nextSels);

      ed.scrollIntoView({
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
