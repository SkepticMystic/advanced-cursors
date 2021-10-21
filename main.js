var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// main.ts
__export(exports, {
  default: () => MyPlugin
});
var import_obsidian2 = __toModule(require("obsidian"));

// SampleSettingTab.ts
var import_obsidian = __toModule(require("obsidian"));
var SettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    let { containerEl } = this;
    containerEl.empty();
  }
};

// main.ts
var DEFAULT_SETTINGS = {
  mySetting: "default"
};
var MyPlugin = class extends import_obsidian2.Plugin {
  onload() {
    return __async(this, null, function* () {
      console.log("Loading advanced cursors");
      yield this.loadSettings();
      this.addCommand({
        id: "open-regex-match-modal",
        name: "Open Regex Match Modal",
        editorCallback: (editor) => {
          new CursorsModal(this.app, editor).open();
        }
      });
      this.addCommand({
        id: "move-to-next-match",
        name: "Move to next instance of current selection",
        editorCallback: (editor) => __async(this, null, function* () {
          this.selectNextInstance(editor);
        })
      });
      this.addCommand({
        id: "add-next-match-to-selections",
        name: "Add next instance of current selection to selections",
        editorCallback: (editor) => __async(this, null, function* () {
          this.selectNextInstance(editor, true);
        })
      });
      this.addSettingTab(new SettingTab(this.app, this));
    });
  }
  selectNextInstance(editor, appendQ = false) {
    return __async(this, null, function* () {
      const currFile = this.app.workspace.getActiveFile();
      const content = yield this.app.vault.read(currFile);
      const lastSelection = editor.listSelections().last();
      console.log({ lastSelection });
      const currSelection = editor.getRange(lastSelection.anchor, lastSelection.head);
      const currOffset = editor.posToOffset(lastSelection.head);
      const nextI = content.indexOf(currSelection, currOffset);
      console.log({ currSelection, currOffset, nextI });
      if (nextI > -1) {
        const nextPos = editor.offsetToPos(nextI);
        const { line, ch } = nextPos;
        editor.getLine(line);
        const anchor = {
          ch,
          line
        };
        const head = {
          ch: ch + currSelection.length,
          line
        };
        if (appendQ) {
          const currSelections = editor.listSelections();
          const reconstructedSelections = this.reconstructCurrentSelections(currSelections);
          reconstructedSelections.push({ anchor, head });
          editor.setSelections(reconstructedSelections);
          console.log(editor.listSelections());
        } else {
          editor.setSelections([{ anchor, head }]);
        }
        console.log({ anchor, head });
      } else {
        new import_obsidian2.Notice(`Cannot find next instance of ${currSelection}`);
      }
    });
  }
  reconstructCurrentSelections(selections) {
    const newSelections = [];
    selections.forEach((selection) => {
      newSelections.push({
        anchor: selection.anchor,
        head: selection.head
      });
    });
    return newSelections;
  }
  onunload() {
  }
  loadSettings() {
    return __async(this, null, function* () {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
    });
  }
  saveSettings() {
    return __async(this, null, function* () {
      yield this.saveData(this.settings);
    });
  }
};
var CursorsModal = class extends import_obsidian2.Modal {
  constructor(app, editor) {
    super(app);
    this.editor = editor;
    this.regexQ = true;
  }
  getSelectionAndOffset() {
    return __async(this, null, function* () {
      const selection = this.editor.getSelection();
      const offset = this.editor.getCursor("from").line;
      if (selection !== "") {
        return { selection, offset };
      } else {
        const currFile = this.app.workspace.getActiveFile();
        const content = yield this.app.vault.cachedRead(currFile);
        return { selection: content, offset: 0 };
      }
    });
  }
  getSelectionsFromQuery(content, offset, query, regexQ) {
    let regex;
    if (regexQ) {
      regex = new RegExp(query, "g");
    } else {
      regex = new RegExp(query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
    }
    const lines = content.split("\n");
    const selections = [];
    lines.forEach((line, i) => {
      const matches = line.matchAll(regex);
      const matchesArr = [...matches];
      matchesArr.forEach((matchArr) => {
        const from = matchArr.index;
        if (from !== void 0) {
          const anchor = {
            ch: from,
            line: i + offset
          };
          const head = {
            ch: from + matchArr[0].length,
            line: i + offset
          };
          selections.push({ anchor, head });
        }
      });
    });
    return selections;
  }
  onOpen() {
    return __async(this, null, function* () {
      let { contentEl } = this;
      const { selection, offset } = yield this.getSelectionAndOffset();
      console.log({ selection });
      const inputDiv = contentEl.createDiv({ cls: "inputDiv" });
      const inputEl = inputDiv.createEl("input", {
        type: "text",
        title: "Search Query",
        attr: { placeholder: "Search Query" }
      });
      inputEl.focus();
      const submitButton = inputDiv.createEl("input", {
        type: "submit",
        text: "submit"
      }, (submitEl) => {
        submitEl.addEventListener("click", () => __async(this, null, function* () {
          try {
            const query = inputEl.value;
            console.log(this.regexQ);
            const selections = this.getSelectionsFromQuery(selection, offset, query, this.regexQ);
            console.log({ selections });
            new import_obsidian2.Notice(`${selections.length} matches found.`);
            this.editor.setSelections(selections);
            this.close();
          } catch (error) {
            console.log(error);
            new import_obsidian2.Notice("Something went wrong, check the console for the error.");
          }
        }));
      });
      const optionsDiv = contentEl.createDiv({ cls: "optionsDiv" });
      optionsDiv.createEl("input", {
        type: "checkbox",
        attr: { name: "regexQ", checked: this.regexQ }
      }, (regexQInput) => {
        regexQInput.addEventListener("change", () => {
          this.regexQ = regexQInput.checked;
        });
      });
      optionsDiv.createEl("label", {
        text: "Regex?",
        attr: { for: "regexQ" }
      });
    });
  }
  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJTYW1wbGVTZXR0aW5nVGFiLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xyXG5cdEFwcCxcclxuXHRFZGl0b3IsXHJcblx0RWRpdG9yUG9zaXRpb24sXHJcblx0RWRpdG9yUmFuZ2UsXHJcblx0RWRpdG9yU2VsZWN0aW9uT3JDYXJldCxcclxuXHRNb2RhbCxcclxuXHROb3RpY2UsXHJcblx0UGx1Z2luLFxyXG5cdFZpZXcsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IFNldHRpbmdUYWIgfSBmcm9tIFwiLi9TYW1wbGVTZXR0aW5nVGFiXCI7XHJcblxyXG5pbnRlcmZhY2UgU2V0dGluZ3Mge1xyXG5cdG15U2V0dGluZzogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTZXR0aW5ncyA9IHtcclxuXHRteVNldHRpbmc6IFwiZGVmYXVsdFwiLFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTXlQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG5cdHNldHRpbmdzOiBTZXR0aW5ncztcclxuXHJcblx0YXN5bmMgb25sb2FkKCkge1xyXG5cdFx0Y29uc29sZS5sb2coXCJMb2FkaW5nIGFkdmFuY2VkIGN1cnNvcnNcIik7XHJcblxyXG5cdFx0YXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogXCJvcGVuLXJlZ2V4LW1hdGNoLW1vZGFsXCIsXHJcblx0XHRcdG5hbWU6IFwiT3BlbiBSZWdleCBNYXRjaCBNb2RhbFwiLFxyXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogKGVkaXRvcjogRWRpdG9yKSA9PiB7XHJcblx0XHRcdFx0bmV3IEN1cnNvcnNNb2RhbCh0aGlzLmFwcCwgZWRpdG9yKS5vcGVuKCk7XHJcblx0XHRcdH0sXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogXCJtb3ZlLXRvLW5leHQtbWF0Y2hcIixcclxuXHRcdFx0bmFtZTogXCJNb3ZlIHRvIG5leHQgaW5zdGFuY2Ugb2YgY3VycmVudCBzZWxlY3Rpb25cIixcclxuXHRcdFx0ZWRpdG9yQ2FsbGJhY2s6IGFzeW5jIChlZGl0b3I6IEVkaXRvcikgPT4ge1xyXG5cdFx0XHRcdHRoaXMuc2VsZWN0TmV4dEluc3RhbmNlKGVkaXRvcik7XHJcblx0XHRcdH0sXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogXCJhZGQtbmV4dC1tYXRjaC10by1zZWxlY3Rpb25zXCIsXHJcblx0XHRcdG5hbWU6IFwiQWRkIG5leHQgaW5zdGFuY2Ugb2YgY3VycmVudCBzZWxlY3Rpb24gdG8gc2VsZWN0aW9uc1wiLFxyXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogYXN5bmMgKGVkaXRvcjogRWRpdG9yKSA9PiB7XHJcblx0XHRcdFx0dGhpcy5zZWxlY3ROZXh0SW5zdGFuY2UoZWRpdG9yLCB0cnVlKTtcclxuXHRcdFx0fSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgc2VsZWN0TmV4dEluc3RhbmNlKGVkaXRvcjogRWRpdG9yLCBhcHBlbmRRID0gZmFsc2UpIHtcclxuXHRcdGNvbnN0IGN1cnJGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuXHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGN1cnJGaWxlKTtcclxuXHJcblx0XHQvLyBjb25zdCBjdXJyU2VsZWN0aW9uID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xyXG5cclxuXHRcdGNvbnN0IGxhc3RTZWxlY3Rpb24gPSBlZGl0b3IubGlzdFNlbGVjdGlvbnMoKS5sYXN0KCk7XHJcblx0XHRjb25zb2xlLmxvZyh7IGxhc3RTZWxlY3Rpb24gfSk7XHJcblx0XHRjb25zdCBjdXJyU2VsZWN0aW9uID0gZWRpdG9yLmdldFJhbmdlKFxyXG5cdFx0XHRsYXN0U2VsZWN0aW9uLmFuY2hvcixcclxuXHRcdFx0bGFzdFNlbGVjdGlvbi5oZWFkXHJcblx0XHQpO1xyXG5cclxuXHRcdGNvbnN0IGN1cnJPZmZzZXQgPSBlZGl0b3IucG9zVG9PZmZzZXQobGFzdFNlbGVjdGlvbi5oZWFkKTtcclxuXHJcblx0XHRjb25zdCBuZXh0SSA9IGNvbnRlbnQuaW5kZXhPZihjdXJyU2VsZWN0aW9uLCBjdXJyT2Zmc2V0KTtcclxuXHJcblx0XHRjb25zb2xlLmxvZyh7IGN1cnJTZWxlY3Rpb24sIGN1cnJPZmZzZXQsIG5leHRJIH0pO1xyXG5cclxuXHRcdGlmIChuZXh0SSA+IC0xKSB7XHJcblx0XHRcdGNvbnN0IG5leHRQb3MgPSBlZGl0b3Iub2Zmc2V0VG9Qb3MobmV4dEkpO1xyXG5cclxuXHRcdFx0Y29uc3QgeyBsaW5lLCBjaCB9ID0gbmV4dFBvcztcclxuXHJcblx0XHRcdGVkaXRvci5nZXRMaW5lKGxpbmUpO1xyXG5cclxuXHRcdFx0Y29uc3QgYW5jaG9yOiBFZGl0b3JQb3NpdGlvbiA9IHtcclxuXHRcdFx0XHRjaCxcclxuXHRcdFx0XHRsaW5lLFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRjb25zdCBoZWFkOiBFZGl0b3JQb3NpdGlvbiA9IHtcclxuXHRcdFx0XHRjaDogY2ggKyBjdXJyU2VsZWN0aW9uLmxlbmd0aCxcclxuXHRcdFx0XHRsaW5lLFxyXG5cdFx0XHR9O1xyXG5cclxuXHRcdFx0aWYgKGFwcGVuZFEpIHtcclxuXHRcdFx0XHRjb25zdCBjdXJyU2VsZWN0aW9uczogRWRpdG9yU2VsZWN0aW9uT3JDYXJldFtdID1cclxuXHRcdFx0XHRcdGVkaXRvci5saXN0U2VsZWN0aW9ucygpO1xyXG5cclxuXHRcdFx0XHRjb25zdCByZWNvbnN0cnVjdGVkU2VsZWN0aW9ucyA9XHJcblx0XHRcdFx0XHR0aGlzLnJlY29uc3RydWN0Q3VycmVudFNlbGVjdGlvbnMoY3VyclNlbGVjdGlvbnMpO1xyXG5cdFx0XHRcdHJlY29uc3RydWN0ZWRTZWxlY3Rpb25zLnB1c2goeyBhbmNob3IsIGhlYWQgfSk7XHJcblxyXG5cdFx0XHRcdGVkaXRvci5zZXRTZWxlY3Rpb25zKHJlY29uc3RydWN0ZWRTZWxlY3Rpb25zKTtcclxuXHJcblx0XHRcdFx0Y29uc29sZS5sb2coZWRpdG9yLmxpc3RTZWxlY3Rpb25zKCkpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdGVkaXRvci5zZXRTZWxlY3Rpb25zKFt7IGFuY2hvciwgaGVhZCB9XSk7XHJcblx0XHRcdH1cclxuXHRcdFx0Y29uc29sZS5sb2coeyBhbmNob3IsIGhlYWQgfSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRuZXcgTm90aWNlKGBDYW5ub3QgZmluZCBuZXh0IGluc3RhbmNlIG9mICR7Y3VyclNlbGVjdGlvbn1gKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJlY29uc3RydWN0Q3VycmVudFNlbGVjdGlvbnMoc2VsZWN0aW9uczogRWRpdG9yU2VsZWN0aW9uT3JDYXJldFtdKSB7XHJcblx0XHRjb25zdCBuZXdTZWxlY3Rpb25zOiBFZGl0b3JTZWxlY3Rpb25PckNhcmV0W10gPSBbXTtcclxuXHRcdHNlbGVjdGlvbnMuZm9yRWFjaCgoc2VsZWN0aW9uKSA9PiB7XHJcblx0XHRcdG5ld1NlbGVjdGlvbnMucHVzaCh7XHJcblx0XHRcdFx0YW5jaG9yOiBzZWxlY3Rpb24uYW5jaG9yLFxyXG5cdFx0XHRcdGhlYWQ6IHNlbGVjdGlvbi5oZWFkLFxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdFx0cmV0dXJuIG5ld1NlbGVjdGlvbnM7XHJcblx0fVxyXG5cclxuXHRvbnVubG9hZCgpIHt9XHJcblxyXG5cdGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKFxyXG5cdFx0XHR7fSxcclxuXHRcdFx0REVGQVVMVF9TRVRUSU5HUyxcclxuXHRcdFx0YXdhaXQgdGhpcy5sb2FkRGF0YSgpXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgc2F2ZVNldHRpbmdzKCkge1xyXG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcclxuXHR9XHJcbn1cclxuXHJcbmNsYXNzIEN1cnNvcnNNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuXHRlZGl0b3I6IEVkaXRvcjtcclxuXHRyZWdleFE6IGJvb2xlYW47XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBlZGl0b3I6IEVkaXRvcikge1xyXG5cdFx0c3VwZXIoYXBwKTtcclxuXHRcdHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG5cdFx0dGhpcy5yZWdleFEgPSB0cnVlO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgZ2V0U2VsZWN0aW9uQW5kT2Zmc2V0KCkge1xyXG5cdFx0Y29uc3Qgc2VsZWN0aW9uID0gdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XHJcblx0XHRjb25zdCBvZmZzZXQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3IoXCJmcm9tXCIpLmxpbmU7XHJcblx0XHRpZiAoc2VsZWN0aW9uICE9PSBcIlwiKSB7XHJcblx0XHRcdHJldHVybiB7IHNlbGVjdGlvbiwgb2Zmc2V0IH07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBjdXJyRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGN1cnJGaWxlKTtcclxuXHRcdFx0cmV0dXJuIHsgc2VsZWN0aW9uOiBjb250ZW50LCBvZmZzZXQ6IDAgfTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNlbGVjdGlvbnNGcm9tUXVlcnkoXHJcblx0XHRjb250ZW50OiBzdHJpbmcsXHJcblx0XHRvZmZzZXQ6IG51bWJlcixcclxuXHRcdHF1ZXJ5OiBzdHJpbmcsXHJcblx0XHRyZWdleFE6IGJvb2xlYW5cclxuXHQpIHtcclxuXHRcdGxldCByZWdleDogUmVnRXhwO1xyXG5cdFx0aWYgKHJlZ2V4USkge1xyXG5cdFx0XHRyZWdleCA9IG5ldyBSZWdFeHAocXVlcnksIFwiZ1wiKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChcclxuXHRcdFx0XHRxdWVyeS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csIFwiXFxcXCQmXCIpLFxyXG5cdFx0XHRcdFwiZ1wiXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xyXG5cdFx0Y29uc3Qgc2VsZWN0aW9uczogRWRpdG9yU2VsZWN0aW9uT3JDYXJldFtdID0gW107XHJcblxyXG5cdFx0bGluZXMuZm9yRWFjaCgobGluZSwgaSkgPT4ge1xyXG5cdFx0XHRjb25zdCBtYXRjaGVzID0gbGluZS5tYXRjaEFsbChyZWdleCk7XHJcblx0XHRcdGNvbnN0IG1hdGNoZXNBcnIgPSBbLi4ubWF0Y2hlc107XHJcblxyXG5cdFx0XHRtYXRjaGVzQXJyLmZvckVhY2goKG1hdGNoQXJyKSA9PiB7XHJcblx0XHRcdFx0Y29uc3QgZnJvbSA9IG1hdGNoQXJyLmluZGV4O1xyXG5cdFx0XHRcdGlmIChmcm9tICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdGNvbnN0IGFuY2hvcjogRWRpdG9yUG9zaXRpb24gPSB7XHJcblx0XHRcdFx0XHRcdGNoOiBmcm9tLFxyXG5cdFx0XHRcdFx0XHRsaW5lOiBpICsgb2Zmc2V0LFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdGNvbnN0IGhlYWQ6IEVkaXRvclBvc2l0aW9uID0ge1xyXG5cdFx0XHRcdFx0XHRjaDogZnJvbSArIG1hdGNoQXJyWzBdLmxlbmd0aCxcclxuXHRcdFx0XHRcdFx0bGluZTogaSArIG9mZnNldCxcclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRzZWxlY3Rpb25zLnB1c2goeyBhbmNob3IsIGhlYWQgfSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBzZWxlY3Rpb25zO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgb25PcGVuKCkge1xyXG5cdFx0bGV0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG5cclxuXHRcdGNvbnN0IHsgc2VsZWN0aW9uLCBvZmZzZXQgfSA9IGF3YWl0IHRoaXMuZ2V0U2VsZWN0aW9uQW5kT2Zmc2V0KCk7XHJcblx0XHRjb25zb2xlLmxvZyh7IHNlbGVjdGlvbiB9KTtcclxuXHJcblx0XHRjb25zdCBpbnB1dERpdiA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiaW5wdXREaXZcIiB9KTtcclxuXHJcblx0XHRjb25zdCBpbnB1dEVsID0gaW5wdXREaXYuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XHJcblx0XHRcdHR5cGU6IFwidGV4dFwiLFxyXG5cdFx0XHR0aXRsZTogXCJTZWFyY2ggUXVlcnlcIixcclxuXHRcdFx0YXR0cjogeyBwbGFjZWhvbGRlcjogXCJTZWFyY2ggUXVlcnlcIiB9LFxyXG5cdFx0fSk7XHJcblx0XHRpbnB1dEVsLmZvY3VzKCk7XHJcblxyXG5cdFx0Y29uc3Qgc3VibWl0QnV0dG9uID0gaW5wdXREaXYuY3JlYXRlRWwoXHJcblx0XHRcdFwiaW5wdXRcIixcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHR5cGU6IFwic3VibWl0XCIsXHJcblx0XHRcdFx0dGV4dDogXCJzdWJtaXRcIixcclxuXHRcdFx0fSxcclxuXHRcdFx0KHN1Ym1pdEVsKSA9PiB7XHJcblx0XHRcdFx0c3VibWl0RWwuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcclxuXHRcdFx0XHRcdHRyeSB7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHF1ZXJ5ID0gaW5wdXRFbC52YWx1ZTtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2codGhpcy5yZWdleFEpO1xyXG5cdFx0XHRcdFx0XHRjb25zdCBzZWxlY3Rpb25zID0gdGhpcy5nZXRTZWxlY3Rpb25zRnJvbVF1ZXJ5KFxyXG5cdFx0XHRcdFx0XHRcdHNlbGVjdGlvbixcclxuXHRcdFx0XHRcdFx0XHRvZmZzZXQsXHJcblx0XHRcdFx0XHRcdFx0cXVlcnksXHJcblx0XHRcdFx0XHRcdFx0dGhpcy5yZWdleFFcclxuXHRcdFx0XHRcdFx0KTtcclxuXHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKHsgc2VsZWN0aW9ucyB9KTtcclxuXHRcdFx0XHRcdFx0bmV3IE5vdGljZShgJHtzZWxlY3Rpb25zLmxlbmd0aH0gbWF0Y2hlcyBmb3VuZC5gKTtcclxuXHJcblx0XHRcdFx0XHRcdHRoaXMuZWRpdG9yLnNldFNlbGVjdGlvbnMoc2VsZWN0aW9ucyk7XHJcblx0XHRcdFx0XHRcdHRoaXMuY2xvc2UoKTtcclxuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XHJcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGVycm9yKTtcclxuXHRcdFx0XHRcdFx0bmV3IE5vdGljZShcclxuXHRcdFx0XHRcdFx0XHRcIlNvbWV0aGluZyB3ZW50IHdyb25nLCBjaGVjayB0aGUgY29uc29sZSBmb3IgdGhlIGVycm9yLlwiXHJcblx0XHRcdFx0XHRcdCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdCk7XHJcblxyXG5cdFx0Y29uc3Qgb3B0aW9uc0RpdiA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwib3B0aW9uc0RpdlwiIH0pO1xyXG5cclxuXHRcdG9wdGlvbnNEaXYuY3JlYXRlRWwoXHJcblx0XHRcdFwiaW5wdXRcIixcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHR5cGU6IFwiY2hlY2tib3hcIixcclxuXHRcdFx0XHRhdHRyOiB7IG5hbWU6IFwicmVnZXhRXCIsIGNoZWNrZWQ6IHRoaXMucmVnZXhRIH0sXHJcblx0XHRcdH0sXHJcblx0XHRcdChyZWdleFFJbnB1dCkgPT4ge1xyXG5cdFx0XHRcdHJlZ2V4UUlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4ge1xyXG5cdFx0XHRcdFx0dGhpcy5yZWdleFEgPSByZWdleFFJbnB1dC5jaGVja2VkO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9XHJcblx0XHQpO1xyXG5cdFx0b3B0aW9uc0Rpdi5jcmVhdGVFbChcImxhYmVsXCIsIHtcclxuXHRcdFx0dGV4dDogXCJSZWdleD9cIixcclxuXHRcdFx0YXR0cjogeyBmb3I6IFwicmVnZXhRXCIgfSxcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0b25DbG9zZSgpIHtcclxuXHRcdGxldCB7IGNvbnRlbnRFbCB9ID0gdGhpcztcclxuXHRcdGNvbnRlbnRFbC5lbXB0eSgpO1xyXG5cdH1cclxufVxyXG4iLCAiaW1wb3J0IHsgQXBwLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nIH0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCBNeVBsdWdpbiBmcm9tIFwiLi9tYWluXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xyXG5cdHBsdWdpbjogTXlQbHVnaW47XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE15UGx1Z2luKSB7XHJcblx0XHRzdXBlcihhcHAsIHBsdWdpbik7XHJcblx0XHR0aGlzLnBsdWdpbiA9IHBsdWdpbjtcclxuXHR9XHJcblxyXG5cdGRpc3BsYXkoKTogdm9pZCB7XHJcblx0XHRsZXQgeyBjb250YWluZXJFbCB9ID0gdGhpcztcclxuXHJcblx0XHRjb250YWluZXJFbC5lbXB0eSgpO1xyXG5cclxuXHRcdC8vIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIlNldHRpbmdzIGZvciBteSBhd2Vzb21lIHBsdWdpbi5cIiB9KTtcclxuXHJcblx0XHQvLyBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuXHRcdC8vIFx0LnNldE5hbWUoXCJTZXR0aW5nICMxXCIpXHJcblx0XHQvLyBcdC5zZXREZXNjKFwiSXQncyBhIHNlY3JldFwiKVxyXG5cdFx0Ly8gXHQuYWRkVGV4dCgodGV4dCkgPT4gdGV4dFxyXG5cdFx0Ly8gXHRcdC5zZXRQbGFjZWhvbGRlcihcIkVudGVyIHlvdXIgc2VjcmV0XCIpXHJcblx0XHQvLyBcdFx0LnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLm15U2V0dGluZylcclxuXHRcdC8vIFx0XHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XHJcblx0XHQvLyBcdFx0XHRjb25zb2xlLmxvZyhcIlNlY3JldDogXCIgKyB2YWx1ZSk7XHJcblx0XHQvLyBcdFx0XHR0aGlzLnBsdWdpbi5zZXR0aW5ncy5teVNldHRpbmcgPSB2YWx1ZTtcclxuXHRcdC8vIFx0XHRcdGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG5cdFx0Ly8gXHRcdH0pXHJcblx0XHQvLyBcdCk7XHJcblx0fVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBLHVCQVVPOzs7QUNWUCxzQkFBK0M7QUFHeEMsK0JBQXlCLGlDQUFpQjtBQUFBLEVBR2hELFlBQVksS0FBVSxRQUFrQjtBQUN2QyxVQUFNLEtBQUs7QUFDWCxTQUFLLFNBQVM7QUFBQTtBQUFBLEVBR2YsVUFBZ0I7QUFDZixRQUFJLEVBQUUsZ0JBQWdCO0FBRXRCLGdCQUFZO0FBQUE7QUFBQTs7O0FER2QsSUFBTSxtQkFBNkI7QUFBQSxFQUNsQyxXQUFXO0FBQUE7QUFHWiw2QkFBc0Msd0JBQU87QUFBQSxFQUd0QyxTQUFTO0FBQUE7QUFDZCxjQUFRLElBQUk7QUFFWixZQUFNLEtBQUs7QUFFWCxXQUFLLFdBQVc7QUFBQSxRQUNmLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLGdCQUFnQixDQUFDLFdBQW1CO0FBQ25DLGNBQUksYUFBYSxLQUFL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
