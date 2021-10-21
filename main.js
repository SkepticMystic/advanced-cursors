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
        id: "open-sample-modal-simple",
        name: "Open sample modal (simple)",
        editorCallback: (editor, view) => {
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
      const iInEntireStr = nextI + currOffset;
      console.log({ currSelection, currOffset, nextI, iInEntireStr });
      if (nextI > -1) {
        const { line } = lastSelection.head;
        const anchor = {
          ch: nextI,
          line
        };
        const head = {
          ch: nextI + currSelection.length,
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJTYW1wbGVTZXR0aW5nVGFiLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xyXG5cdEFwcCxcclxuXHRFZGl0b3IsXHJcblx0RWRpdG9yUG9zaXRpb24sXHJcblx0RWRpdG9yUmFuZ2UsXHJcblx0RWRpdG9yU2VsZWN0aW9uT3JDYXJldCxcclxuXHRNb2RhbCxcclxuXHROb3RpY2UsXHJcblx0UGx1Z2luLFxyXG5cdFZpZXcsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IFNldHRpbmdUYWIgfSBmcm9tIFwiLi9TYW1wbGVTZXR0aW5nVGFiXCI7XHJcblxyXG5pbnRlcmZhY2UgU2V0dGluZ3Mge1xyXG5cdG15U2V0dGluZzogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTZXR0aW5ncyA9IHtcclxuXHRteVNldHRpbmc6IFwiZGVmYXVsdFwiLFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTXlQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG5cdHNldHRpbmdzOiBTZXR0aW5ncztcclxuXHJcblx0YXN5bmMgb25sb2FkKCkge1xyXG5cdFx0Y29uc29sZS5sb2coXCJMb2FkaW5nIGFkdmFuY2VkIGN1cnNvcnNcIik7XHJcblxyXG5cdFx0YXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogXCJvcGVuLXNhbXBsZS1tb2RhbC1zaW1wbGVcIixcclxuXHRcdFx0bmFtZTogXCJPcGVuIHNhbXBsZSBtb2RhbCAoc2ltcGxlKVwiLFxyXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogKGVkaXRvcjogRWRpdG9yLCB2aWV3OiBWaWV3KSA9PiB7XHJcblx0XHRcdFx0bmV3IEN1cnNvcnNNb2RhbCh0aGlzLmFwcCwgZWRpdG9yKS5vcGVuKCk7XHJcblx0XHRcdH0sXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogXCJtb3ZlLXRvLW5leHQtbWF0Y2hcIixcclxuXHRcdFx0bmFtZTogXCJNb3ZlIHRvIG5leHQgaW5zdGFuY2Ugb2YgY3VycmVudCBzZWxlY3Rpb25cIixcclxuXHRcdFx0ZWRpdG9yQ2FsbGJhY2s6IGFzeW5jIChlZGl0b3I6IEVkaXRvcikgPT4ge1xyXG5cdFx0XHRcdHRoaXMuc2VsZWN0TmV4dEluc3RhbmNlKGVkaXRvcik7XHJcblx0XHRcdH0sXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLmFkZENvbW1hbmQoe1xyXG5cdFx0XHRpZDogXCJhZGQtbmV4dC1tYXRjaC10by1zZWxlY3Rpb25zXCIsXHJcblx0XHRcdG5hbWU6IFwiQWRkIG5leHQgaW5zdGFuY2Ugb2YgY3VycmVudCBzZWxlY3Rpb24gdG8gc2VsZWN0aW9uc1wiLFxyXG5cdFx0XHRlZGl0b3JDYWxsYmFjazogYXN5bmMgKGVkaXRvcjogRWRpdG9yKSA9PiB7XHJcblx0XHRcdFx0dGhpcy5zZWxlY3ROZXh0SW5zdGFuY2UoZWRpdG9yLCB0cnVlKTtcclxuXHRcdFx0fSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgc2VsZWN0TmV4dEluc3RhbmNlKGVkaXRvcjogRWRpdG9yLCBhcHBlbmRRID0gZmFsc2UpIHtcclxuXHRcdGNvbnN0IGN1cnJGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuXHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGN1cnJGaWxlKTtcclxuXHJcblx0XHQvLyBjb25zdCBjdXJyU2VsZWN0aW9uID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xyXG5cclxuXHRcdGNvbnN0IGxhc3RTZWxlY3Rpb24gPSBlZGl0b3IubGlzdFNlbGVjdGlvbnMoKS5sYXN0KCk7XHJcblx0XHRjb25zb2xlLmxvZyh7IGxhc3RTZWxlY3Rpb24gfSk7XHJcblx0XHRjb25zdCBjdXJyU2VsZWN0aW9uID0gZWRpdG9yLmdldFJhbmdlKFxyXG5cdFx0XHRsYXN0U2VsZWN0aW9uLmFuY2hvcixcclxuXHRcdFx0bGFzdFNlbGVjdGlvbi5oZWFkXHJcblx0XHQpO1xyXG5cclxuXHRcdGNvbnN0IGN1cnJPZmZzZXQgPSBlZGl0b3IucG9zVG9PZmZzZXQobGFzdFNlbGVjdGlvbi5oZWFkKTtcclxuXHJcblx0XHRjb25zdCBuZXh0SSA9IGNvbnRlbnQuaW5kZXhPZihjdXJyU2VsZWN0aW9uLCBjdXJyT2Zmc2V0KTtcclxuXHRcdGNvbnN0IGlJbkVudGlyZVN0ciA9IG5leHRJICsgY3Vyck9mZnNldDtcclxuXHJcblx0XHRjb25zb2xlLmxvZyh7IGN1cnJTZWxlY3Rpb24sIGN1cnJPZmZzZXQsIG5leHRJLCBpSW5FbnRpcmVTdHIgfSk7XHJcblxyXG5cdFx0aWYgKG5leHRJID4gLTEpIHtcclxuXHRcdFx0Y29uc3QgeyBsaW5lIH0gPSBsYXN0U2VsZWN0aW9uLmhlYWQ7XHJcblx0XHRcdGNvbnN0IGFuY2hvcjogRWRpdG9yUG9zaXRpb24gPSB7XHJcblx0XHRcdFx0Y2g6IG5leHRJLFxyXG5cdFx0XHRcdGxpbmUsXHJcblx0XHRcdH07XHJcblx0XHRcdGNvbnN0IGhlYWQ6IEVkaXRvclBvc2l0aW9uID0ge1xyXG5cdFx0XHRcdGNoOiBuZXh0SSArIGN1cnJTZWxlY3Rpb24ubGVuZ3RoLFxyXG5cdFx0XHRcdGxpbmUsXHJcblx0XHRcdH07XHJcblxyXG5cdFx0XHRpZiAoYXBwZW5kUSkge1xyXG5cdFx0XHRcdGNvbnN0IGN1cnJTZWxlY3Rpb25zOiBFZGl0b3JTZWxlY3Rpb25PckNhcmV0W10gPVxyXG5cdFx0XHRcdFx0ZWRpdG9yLmxpc3RTZWxlY3Rpb25zKCk7XHJcblxyXG5cdFx0XHRcdGNvbnN0IHJlY29uc3RydWN0ZWRTZWxlY3Rpb25zID1cclxuXHRcdFx0XHRcdHRoaXMucmVjb25zdHJ1Y3RDdXJyZW50U2VsZWN0aW9ucyhjdXJyU2VsZWN0aW9ucyk7XHJcblx0XHRcdFx0cmVjb25zdHJ1Y3RlZFNlbGVjdGlvbnMucHVzaCh7IGFuY2hvciwgaGVhZCB9KTtcclxuXHJcblx0XHRcdFx0ZWRpdG9yLnNldFNlbGVjdGlvbnMocmVjb25zdHJ1Y3RlZFNlbGVjdGlvbnMpO1xyXG5cclxuXHRcdFx0XHRjb25zb2xlLmxvZyhlZGl0b3IubGlzdFNlbGVjdGlvbnMoKSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0ZWRpdG9yLnNldFNlbGVjdGlvbnMoW3sgYW5jaG9yLCBoZWFkIH1dKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRjb25zb2xlLmxvZyh7IGFuY2hvciwgaGVhZCB9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG5ldyBOb3RpY2UoYENhbm5vdCBmaW5kIG5leHQgaW5zdGFuY2Ugb2YgJHtjdXJyU2VsZWN0aW9ufWApO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmVjb25zdHJ1Y3RDdXJyZW50U2VsZWN0aW9ucyhzZWxlY3Rpb25zOiBFZGl0b3JTZWxlY3Rpb25PckNhcmV0W10pIHtcclxuXHRcdGNvbnN0IG5ld1NlbGVjdGlvbnM6IEVkaXRvclNlbGVjdGlvbk9yQ2FyZXRbXSA9IFtdO1xyXG5cdFx0c2VsZWN0aW9ucy5mb3JFYWNoKChzZWxlY3Rpb24pID0+IHtcclxuXHRcdFx0bmV3U2VsZWN0aW9ucy5wdXNoKHtcclxuXHRcdFx0XHRhbmNob3I6IHNlbGVjdGlvbi5hbmNob3IsXHJcblx0XHRcdFx0aGVhZDogc2VsZWN0aW9uLmhlYWQsXHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0XHRyZXR1cm4gbmV3U2VsZWN0aW9ucztcclxuXHR9XHJcblxyXG5cdG9udW5sb2FkKCkge31cclxuXHJcblx0YXN5bmMgbG9hZFNldHRpbmdzKCkge1xyXG5cdFx0dGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oXHJcblx0XHRcdHt9LFxyXG5cdFx0XHRERUZBVUxUX1NFVFRJTkdTLFxyXG5cdFx0XHRhd2FpdCB0aGlzLmxvYWREYXRhKClcclxuXHRcdCk7XHJcblx0fVxyXG5cclxuXHRhc3luYyBzYXZlU2V0dGluZ3MoKSB7XHJcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG5cdH1cclxufVxyXG5cclxuY2xhc3MgQ3Vyc29yc01vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG5cdGVkaXRvcjogRWRpdG9yO1xyXG5cdHJlZ2V4UTogYm9vbGVhbjtcclxuXHJcblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIGVkaXRvcjogRWRpdG9yKSB7XHJcblx0XHRzdXBlcihhcHApO1xyXG5cdFx0dGhpcy5lZGl0b3IgPSBlZGl0b3I7XHJcblx0XHR0aGlzLnJlZ2V4USA9IHRydWU7XHJcblx0fVxyXG5cclxuXHRhc3luYyBnZXRTZWxlY3Rpb25BbmRPZmZzZXQoKSB7XHJcblx0XHRjb25zdCBzZWxlY3Rpb24gPSB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb24oKTtcclxuXHRcdGNvbnN0IG9mZnNldCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvcihcImZyb21cIikubGluZTtcclxuXHRcdGlmIChzZWxlY3Rpb24gIT09IFwiXCIpIHtcclxuXHRcdFx0cmV0dXJuIHsgc2VsZWN0aW9uLCBvZmZzZXQgfTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNvbnN0IGN1cnJGaWxlID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuXHRcdFx0Y29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNhY2hlZFJlYWQoY3VyckZpbGUpO1xyXG5cdFx0XHRyZXR1cm4geyBzZWxlY3Rpb246IGNvbnRlbnQsIG9mZnNldDogMCB9O1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Z2V0U2VsZWN0aW9uc0Zyb21RdWVyeShcclxuXHRcdGNvbnRlbnQ6IHN0cmluZyxcclxuXHRcdG9mZnNldDogbnVtYmVyLFxyXG5cdFx0cXVlcnk6IHN0cmluZyxcclxuXHRcdHJlZ2V4UTogYm9vbGVhblxyXG5cdCkge1xyXG5cdFx0bGV0IHJlZ2V4OiBSZWdFeHA7XHJcblx0XHRpZiAocmVnZXhRKSB7XHJcblx0XHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChxdWVyeSwgXCJnXCIpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmVnZXggPSBuZXcgUmVnRXhwKFxyXG5cdFx0XHRcdHF1ZXJ5LnJlcGxhY2UoL1stXFwvXFxcXF4kKis/LigpfFtcXF17fV0vZywgXCJcXFxcJCZcIiksXHJcblx0XHRcdFx0XCJnXCJcclxuXHRcdFx0KTtcclxuXHRcdH1cclxuXHJcblx0XHRjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XHJcblx0XHRjb25zdCBzZWxlY3Rpb25zOiBFZGl0b3JTZWxlY3Rpb25PckNhcmV0W10gPSBbXTtcclxuXHJcblx0XHRsaW5lcy5mb3JFYWNoKChsaW5lLCBpKSA9PiB7XHJcblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBsaW5lLm1hdGNoQWxsKHJlZ2V4KTtcclxuXHRcdFx0Y29uc3QgbWF0Y2hlc0FyciA9IFsuLi5tYXRjaGVzXTtcclxuXHJcblx0XHRcdG1hdGNoZXNBcnIuZm9yRWFjaCgobWF0Y2hBcnIpID0+IHtcclxuXHRcdFx0XHRjb25zdCBmcm9tID0gbWF0Y2hBcnIuaW5kZXg7XHJcblx0XHRcdFx0aWYgKGZyb20gIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0Y29uc3QgYW5jaG9yOiBFZGl0b3JQb3NpdGlvbiA9IHtcclxuXHRcdFx0XHRcdFx0Y2g6IGZyb20sXHJcblx0XHRcdFx0XHRcdGxpbmU6IGkgKyBvZmZzZXQsXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0Y29uc3QgaGVhZDogRWRpdG9yUG9zaXRpb24gPSB7XHJcblx0XHRcdFx0XHRcdGNoOiBmcm9tICsgbWF0Y2hBcnJbMF0ubGVuZ3RoLFxyXG5cdFx0XHRcdFx0XHRsaW5lOiBpICsgb2Zmc2V0LFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdHNlbGVjdGlvbnMucHVzaCh7IGFuY2hvciwgaGVhZCB9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIHNlbGVjdGlvbnM7XHJcblx0fVxyXG5cclxuXHRhc3luYyBvbk9wZW4oKSB7XHJcblx0XHRsZXQgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcblxyXG5cdFx0Y29uc3QgeyBzZWxlY3Rpb24sIG9mZnNldCB9ID0gYXdhaXQgdGhpcy5nZXRTZWxlY3Rpb25BbmRPZmZzZXQoKTtcclxuXHRcdGNvbnNvbGUubG9nKHsgc2VsZWN0aW9uIH0pO1xyXG5cclxuXHRcdGNvbnN0IGlucHV0RGl2ID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJpbnB1dERpdlwiIH0pO1xyXG5cclxuXHRcdGNvbnN0IGlucHV0RWwgPSBpbnB1dERpdi5jcmVhdGVFbChcImlucHV0XCIsIHtcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCIsXHJcblx0XHRcdHRpdGxlOiBcIlNlYXJjaCBRdWVyeVwiLFxyXG5cdFx0XHRhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIlNlYXJjaCBRdWVyeVwiIH0sXHJcblx0XHR9KTtcclxuXHRcdGlucHV0RWwuZm9jdXMoKTtcclxuXHJcblx0XHRjb25zdCBzdWJtaXRCdXR0b24gPSBpbnB1dERpdi5jcmVhdGVFbChcclxuXHRcdFx0XCJpbnB1dFwiLFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogXCJzdWJtaXRcIixcclxuXHRcdFx0XHR0ZXh0OiBcInN1Ym1pdFwiLFxyXG5cdFx0XHR9LFxyXG5cdFx0XHQoc3VibWl0RWwpID0+IHtcclxuXHRcdFx0XHRzdWJtaXRFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcXVlcnkgPSBpbnB1dEVsLnZhbHVlO1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyh0aGlzLnJlZ2V4USk7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHNlbGVjdGlvbnMgPSB0aGlzLmdldFNlbGVjdGlvbnNGcm9tUXVlcnkoXHJcblx0XHRcdFx0XHRcdFx0c2VsZWN0aW9uLFxyXG5cdFx0XHRcdFx0XHRcdG9mZnNldCxcclxuXHRcdFx0XHRcdFx0XHRxdWVyeSxcclxuXHRcdFx0XHRcdFx0XHR0aGlzLnJlZ2V4UVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coeyBzZWxlY3Rpb25zIH0pO1xyXG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKGAke3NlbGVjdGlvbnMubGVuZ3RofSBtYXRjaGVzIGZvdW5kLmApO1xyXG5cclxuXHRcdFx0XHRcdFx0dGhpcy5lZGl0b3Iuc2V0U2VsZWN0aW9ucyhzZWxlY3Rpb25zKTtcclxuXHRcdFx0XHRcdFx0dGhpcy5jbG9zZSgpO1xyXG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xyXG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKFxyXG5cdFx0XHRcdFx0XHRcdFwiU29tZXRoaW5nIHdlbnQgd3JvbmcsIGNoZWNrIHRoZSBjb25zb2xlIGZvciB0aGUgZXJyb3IuXCJcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0KTtcclxuXHJcblx0XHRjb25zdCBvcHRpb25zRGl2ID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJvcHRpb25zRGl2XCIgfSk7XHJcblxyXG5cdFx0b3B0aW9uc0Rpdi5jcmVhdGVFbChcclxuXHRcdFx0XCJpbnB1dFwiLFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogXCJjaGVja2JveFwiLFxyXG5cdFx0XHRcdGF0dHI6IHsgbmFtZTogXCJyZWdleFFcIiwgY2hlY2tlZDogdGhpcy5yZWdleFEgfSxcclxuXHRcdFx0fSxcclxuXHRcdFx0KHJlZ2V4UUlucHV0KSA9PiB7XHJcblx0XHRcdFx0cmVnZXhRSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnJlZ2V4USA9IHJlZ2V4UUlucHV0LmNoZWNrZWQ7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdCk7XHJcblx0XHRvcHRpb25zRGl2LmNyZWF0ZUVsKFwibGFiZWxcIiwge1xyXG5cdFx0XHR0ZXh0OiBcIlJlZ2V4P1wiLFxyXG5cdFx0XHRhdHRyOiB7IGZvcjogXCJyZWdleFFcIiB9LFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRvbkNsb3NlKCkge1xyXG5cdFx0bGV0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XHJcblx0fVxyXG59XHJcbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IE15UGx1Z2luIGZyb20gXCIuL21haW5cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcblx0cGx1Z2luOiBNeVBsdWdpbjtcclxuXHJcblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogTXlQbHVnaW4pIHtcclxuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcclxuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG5cdH1cclxuXHJcblx0ZGlzcGxheSgpOiB2b2lkIHtcclxuXHRcdGxldCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG5cclxuXHRcdGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG5cdFx0Ly8gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiU2V0dGluZ3MgZm9yIG15IGF3ZXNvbWUgcGx1Z2luLlwiIH0pO1xyXG5cclxuXHRcdC8vIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0Ly8gXHQuc2V0TmFtZShcIlNldHRpbmcgIzFcIilcclxuXHRcdC8vIFx0LnNldERlc2MoXCJJdCdzIGEgc2VjcmV0XCIpXHJcblx0XHQvLyBcdC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XHJcblx0XHQvLyBcdFx0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgeW91ciBzZWNyZXRcIilcclxuXHRcdC8vIFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubXlTZXR0aW5nKVxyXG5cdFx0Ly8gXHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuXHRcdC8vIFx0XHRcdGNvbnNvbGUubG9nKFwiU2VjcmV0OiBcIiArIHZhbHVlKTtcclxuXHRcdC8vIFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLm15U2V0dGluZyA9IHZhbHVlO1xyXG5cdFx0Ly8gXHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblx0XHQvLyBcdFx0fSlcclxuXHRcdC8vIFx0KTtcclxuXHR9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBVU87OztBQ1ZQLHNCQUErQztBQUd4QywrQkFBeUIsaUNBQWlCO0FBQUEsRUFHaEQsWUFBWSxLQUFVLFFBQWtCO0FBQ3ZDLFVBQU0sS0FBSztBQUNYLFNBQUssU0FBUztBQUFBO0FBQUEsRUFHZixVQUFnQjtBQUNmLFFBQUksRUFBRSxnQkFBZ0I7QUFFdEIsZ0JBQVk7QUFBQTtBQUFBOzs7QURHZCxJQUFNLG1CQUE2QjtBQUFBLEVBQ2xDLFdBQVc7QUFBQTtBQUdaLDZCQUFzQyx3QkFBTztBQUFBLEVBR3RDLFNBQVM7QUFBQTtBQUNkLGNBQVEsSUFBSTtBQUVaLFlBQU0sS0FBSztBQUVYLFdBQUssV0FBVztBQUFBLFFBQ2YsSUFBSTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sZ0JBQWdCLENBQUMsUUFBZ0IsU0FBZTtBQUMvQyxjQUFJLGFB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
