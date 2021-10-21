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
      yield this.loadSettings();
      this.addCommand({
        id: "open-sample-modal-simple",
        name: "Open sample modal (simple)",
        editorCallback: (editor, view) => {
          const query = "test";
          new CursorsModal(this.app, editor).open();
        }
      });
      this.addSettingTab(new SettingTab(this.app, this));
    });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJTYW1wbGVTZXR0aW5nVGFiLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xyXG5cdEFwcCxcclxuXHRFZGl0b3IsXHJcblx0RWRpdG9yUG9zaXRpb24sXHJcblx0RWRpdG9yU2VsZWN0aW9uT3JDYXJldCxcclxuXHRNb2RhbCxcclxuXHROb3RpY2UsXHJcblx0UGx1Z2luLFxyXG5cdFZpZXcsXHJcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XHJcbmltcG9ydCB7IFNldHRpbmdUYWIgfSBmcm9tIFwiLi9TYW1wbGVTZXR0aW5nVGFiXCI7XHJcblxyXG5pbnRlcmZhY2UgU2V0dGluZ3Mge1xyXG5cdG15U2V0dGluZzogc3RyaW5nO1xyXG59XHJcblxyXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTZXR0aW5ncyA9IHtcclxuXHRteVNldHRpbmc6IFwiZGVmYXVsdFwiLFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTXlQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xyXG5cdHNldHRpbmdzOiBTZXR0aW5ncztcclxuXHJcblx0YXN5bmMgb25sb2FkKCkge1xyXG5cdFx0YXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcclxuXHJcblx0XHQvLyBUaGlzIGFkZHMgYSBzaW1wbGUgY29tbWFuZCB0aGF0IGNhbiBiZSB0cmlnZ2VyZWQgYW55d2hlcmVcclxuXHRcdHRoaXMuYWRkQ29tbWFuZCh7XHJcblx0XHRcdGlkOiBcIm9wZW4tc2FtcGxlLW1vZGFsLXNpbXBsZVwiLFxyXG5cdFx0XHRuYW1lOiBcIk9wZW4gc2FtcGxlIG1vZGFsIChzaW1wbGUpXCIsXHJcblx0XHRcdGVkaXRvckNhbGxiYWNrOiAoZWRpdG9yOiBFZGl0b3IsIHZpZXc6IFZpZXcpID0+IHtcclxuXHRcdFx0XHRjb25zdCBxdWVyeSA9IFwidGVzdFwiO1xyXG5cdFx0XHRcdG5ldyBDdXJzb3JzTW9kYWwodGhpcy5hcHAsIGVkaXRvcikub3BlbigpO1xyXG5cdFx0XHR9LFxyXG5cdFx0fSk7XHJcblx0XHQvLyBUaGlzIGFkZHMgYSBzZXR0aW5ncyB0YWIgc28gdGhlIHVzZXIgY2FuIGNvbmZpZ3VyZSB2YXJpb3VzIGFzcGVjdHMgb2YgdGhlIHBsdWdpblxyXG5cdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XHJcblx0fVxyXG5cclxuXHRvbnVubG9hZCgpIHt9XHJcblxyXG5cdGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcclxuXHRcdHRoaXMuc2V0dGluZ3MgPSBPYmplY3QuYXNzaWduKFxyXG5cdFx0XHR7fSxcclxuXHRcdFx0REVGQVVMVF9TRVRUSU5HUyxcclxuXHRcdFx0YXdhaXQgdGhpcy5sb2FkRGF0YSgpXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgc2F2ZVNldHRpbmdzKCkge1xyXG5cdFx0YXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcclxuXHR9XHJcbn1cclxuXHJcbmNsYXNzIEN1cnNvcnNNb2RhbCBleHRlbmRzIE1vZGFsIHtcclxuXHRlZGl0b3I6IEVkaXRvcjtcclxuXHRyZWdleFE6IGJvb2xlYW47XHJcblxyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBlZGl0b3I6IEVkaXRvcikge1xyXG5cdFx0c3VwZXIoYXBwKTtcclxuXHRcdHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG5cdFx0dGhpcy5yZWdleFEgPSB0cnVlO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgZ2V0U2VsZWN0aW9uQW5kT2Zmc2V0KCkge1xyXG5cdFx0Y29uc3Qgc2VsZWN0aW9uID0gdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XHJcblx0XHRjb25zdCBvZmZzZXQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3IoXCJmcm9tXCIpLmxpbmU7XHJcblx0XHRpZiAoc2VsZWN0aW9uICE9PSBcIlwiKSB7XHJcblx0XHRcdHJldHVybiB7IHNlbGVjdGlvbiwgb2Zmc2V0IH07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBjdXJyRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGN1cnJGaWxlKTtcclxuXHRcdFx0cmV0dXJuIHsgc2VsZWN0aW9uOiBjb250ZW50LCBvZmZzZXQ6IDAgfTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNlbGVjdGlvbnNGcm9tUXVlcnkoXHJcblx0XHRjb250ZW50OiBzdHJpbmcsXHJcblx0XHRvZmZzZXQ6IG51bWJlcixcclxuXHRcdHF1ZXJ5OiBzdHJpbmcsXHJcblx0XHRyZWdleFE6IGJvb2xlYW5cclxuXHQpIHtcclxuXHRcdGxldCByZWdleDogUmVnRXhwO1xyXG5cdFx0aWYgKHJlZ2V4USkge1xyXG5cdFx0XHRyZWdleCA9IG5ldyBSZWdFeHAocXVlcnksIFwiZ1wiKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJlZ2V4ID0gbmV3IFJlZ0V4cChcclxuXHRcdFx0XHRxdWVyeS5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxde31dL2csIFwiXFxcXCQmXCIpLFxyXG5cdFx0XHRcdFwiZ1wiXHJcblx0XHRcdCk7XHJcblx0XHR9XHJcblxyXG5cdFx0Y29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KFwiXFxuXCIpO1xyXG5cdFx0Y29uc3Qgc2VsZWN0aW9uczogRWRpdG9yU2VsZWN0aW9uT3JDYXJldFtdID0gW107XHJcblxyXG5cdFx0bGluZXMuZm9yRWFjaCgobGluZSwgaSkgPT4ge1xyXG5cdFx0XHRjb25zdCBtYXRjaGVzID0gbGluZS5tYXRjaEFsbChyZWdleCk7XHJcblx0XHRcdGNvbnN0IG1hdGNoZXNBcnIgPSBbLi4ubWF0Y2hlc107XHJcblxyXG5cdFx0XHRtYXRjaGVzQXJyLmZvckVhY2goKG1hdGNoQXJyKSA9PiB7XHJcblx0XHRcdFx0Y29uc3QgZnJvbSA9IG1hdGNoQXJyLmluZGV4O1xyXG5cdFx0XHRcdGlmIChmcm9tICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRcdGNvbnN0IGFuY2hvcjogRWRpdG9yUG9zaXRpb24gPSB7XHJcblx0XHRcdFx0XHRcdGNoOiBmcm9tLFxyXG5cdFx0XHRcdFx0XHRsaW5lOiBpICsgb2Zmc2V0LFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdGNvbnN0IGhlYWQ6IEVkaXRvclBvc2l0aW9uID0ge1xyXG5cdFx0XHRcdFx0XHRjaDogZnJvbSArIG1hdGNoQXJyWzBdLmxlbmd0aCxcclxuXHRcdFx0XHRcdFx0bGluZTogaSArIG9mZnNldCxcclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRzZWxlY3Rpb25zLnB1c2goeyBhbmNob3IsIGhlYWQgfSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cclxuXHRcdHJldHVybiBzZWxlY3Rpb25zO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgb25PcGVuKCkge1xyXG5cdFx0bGV0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG5cclxuXHRcdGNvbnN0IHsgc2VsZWN0aW9uLCBvZmZzZXQgfSA9IGF3YWl0IHRoaXMuZ2V0U2VsZWN0aW9uQW5kT2Zmc2V0KCk7XHJcblx0XHRjb25zb2xlLmxvZyh7IHNlbGVjdGlvbiB9KTtcclxuXHJcblx0XHRjb25zdCBpbnB1dERpdiA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoeyBjbHM6IFwiaW5wdXREaXZcIiB9KTtcclxuXHJcblx0XHRjb25zdCBpbnB1dEVsID0gaW5wdXREaXYuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XHJcblx0XHRcdHR5cGU6IFwidGV4dFwiLFxyXG5cdFx0XHR0aXRsZTogXCJTZWFyY2ggUXVlcnlcIixcclxuXHRcdFx0YXR0cjogeyBwbGFjZWhvbGRlcjogXCJTZWFyY2ggUXVlcnlcIiB9LFxyXG5cdFx0fSk7XHJcblx0XHRpbnB1dEVsLmZvY3VzKClcclxuXHJcblx0XHRjb25zdCBzdWJtaXRCdXR0b24gPSBpbnB1dERpdi5jcmVhdGVFbChcclxuXHRcdFx0XCJpbnB1dFwiLFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogXCJzdWJtaXRcIixcclxuXHRcdFx0XHR0ZXh0OiBcInN1Ym1pdFwiLFxyXG5cdFx0XHR9LFxyXG5cdFx0XHQoc3VibWl0RWwpID0+IHtcclxuXHRcdFx0XHRzdWJtaXRFbC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcXVlcnkgPSBpbnB1dEVsLnZhbHVlO1xyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyh0aGlzLnJlZ2V4USk7XHJcblx0XHRcdFx0XHRcdGNvbnN0IHNlbGVjdGlvbnMgPSB0aGlzLmdldFNlbGVjdGlvbnNGcm9tUXVlcnkoXHJcblx0XHRcdFx0XHRcdFx0c2VsZWN0aW9uLFxyXG5cdFx0XHRcdFx0XHRcdG9mZnNldCxcclxuXHRcdFx0XHRcdFx0XHRxdWVyeSxcclxuXHRcdFx0XHRcdFx0XHR0aGlzLnJlZ2V4UVxyXG5cdFx0XHRcdFx0XHQpO1xyXG5cclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coeyBzZWxlY3Rpb25zIH0pO1xyXG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKGAke3NlbGVjdGlvbnMubGVuZ3RofSBtYXRjaGVzIGZvdW5kLmApO1xyXG5cdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0dGhpcy5lZGl0b3Iuc2V0U2VsZWN0aW9ucyhzZWxlY3Rpb25zKTtcclxuXHRcdFx0XHRcdFx0dGhpcy5jbG9zZSgpO1xyXG5cdFx0XHRcdFx0fSBjYXRjaCAoZXJyb3IpIHtcclxuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZXJyb3IpO1xyXG5cdFx0XHRcdFx0XHRuZXcgTm90aWNlKFxyXG5cdFx0XHRcdFx0XHRcdFwiU29tZXRoaW5nIHdlbnQgd3JvbmcsIGNoZWNrIHRoZSBjb25zb2xlIGZvciB0aGUgZXJyb3IuXCJcclxuXHRcdFx0XHRcdFx0KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0KTtcclxuXHJcblx0XHRjb25zdCBvcHRpb25zRGl2ID0gY29udGVudEVsLmNyZWF0ZURpdih7IGNsczogXCJvcHRpb25zRGl2XCIgfSk7XHJcblxyXG5cdFx0b3B0aW9uc0Rpdi5jcmVhdGVFbChcclxuXHRcdFx0XCJpbnB1dFwiLFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dHlwZTogXCJjaGVja2JveFwiLFxyXG5cdFx0XHRcdGF0dHI6IHsgbmFtZTogXCJyZWdleFFcIiwgY2hlY2tlZDogdGhpcy5yZWdleFEgfSxcclxuXHRcdFx0fSxcclxuXHRcdFx0KHJlZ2V4UUlucHV0KSA9PiB7XHJcblx0XHRcdFx0cmVnZXhRSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiB7XHJcblx0XHRcdFx0XHR0aGlzLnJlZ2V4USA9IHJlZ2V4UUlucHV0LmNoZWNrZWQ7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH1cclxuXHRcdCk7XHJcblx0XHRvcHRpb25zRGl2LmNyZWF0ZUVsKFwibGFiZWxcIiwge1xyXG5cdFx0XHR0ZXh0OiBcIlJlZ2V4P1wiLFxyXG5cdFx0XHRhdHRyOiB7IGZvcjogXCJyZWdleFFcIiB9LFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRvbkNsb3NlKCkge1xyXG5cdFx0bGV0IHsgY29udGVudEVsIH0gPSB0aGlzO1xyXG5cdFx0Y29udGVudEVsLmVtcHR5KCk7XHJcblx0fVxyXG59XHJcbiIsICJpbXBvcnQgeyBBcHAsIFBsdWdpblNldHRpbmdUYWIsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IE15UGx1Z2luIGZyb20gXCIuL21haW5cIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XHJcblx0cGx1Z2luOiBNeVBsdWdpbjtcclxuXHJcblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogTXlQbHVnaW4pIHtcclxuXHRcdHN1cGVyKGFwcCwgcGx1Z2luKTtcclxuXHRcdHRoaXMucGx1Z2luID0gcGx1Z2luO1xyXG5cdH1cclxuXHJcblx0ZGlzcGxheSgpOiB2b2lkIHtcclxuXHRcdGxldCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG5cclxuXHRcdGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcblxyXG5cdFx0Ly8gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiU2V0dGluZ3MgZm9yIG15IGF3ZXNvbWUgcGx1Z2luLlwiIH0pO1xyXG5cclxuXHRcdC8vIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG5cdFx0Ly8gXHQuc2V0TmFtZShcIlNldHRpbmcgIzFcIilcclxuXHRcdC8vIFx0LnNldERlc2MoXCJJdCdzIGEgc2VjcmV0XCIpXHJcblx0XHQvLyBcdC5hZGRUZXh0KCh0ZXh0KSA9PiB0ZXh0XHJcblx0XHQvLyBcdFx0LnNldFBsYWNlaG9sZGVyKFwiRW50ZXIgeW91ciBzZWNyZXRcIilcclxuXHRcdC8vIFx0XHQuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MubXlTZXR0aW5nKVxyXG5cdFx0Ly8gXHRcdC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcclxuXHRcdC8vIFx0XHRcdGNvbnNvbGUubG9nKFwiU2VjcmV0OiBcIiArIHZhbHVlKTtcclxuXHRcdC8vIFx0XHRcdHRoaXMucGx1Z2luLnNldHRpbmdzLm15U2V0dGluZyA9IHZhbHVlO1xyXG5cdFx0Ly8gXHRcdFx0YXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcblx0XHQvLyBcdFx0fSlcclxuXHRcdC8vIFx0KTtcclxuXHR9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUEsdUJBU087OztBQ1RQLHNCQUErQztBQUd4QywrQkFBeUIsaUNBQWlCO0FBQUEs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
