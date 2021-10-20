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
  getSelectionsFromQuery(content, offset, query) {
    const regex = new RegExp(query, "g");
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
      const inputEl = contentEl.createEl("input", {
        type: "text",
        title: "Search Query",
        attr: { placeholder: "Search Query" }
      });
      const submitButton = contentEl.createEl("input", {
        type: "submit",
        text: "submit"
      }, (submitEl) => {
        submitEl.addEventListener("click", () => __async(this, null, function* () {
          const query = inputEl.value;
          const selections = this.getSelectionsFromQuery(selection, offset, query);
          console.log({ selections });
          this.editor.setSelections(selections);
          this.close();
        }));
      });
    });
  }
  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyIsICJTYW1wbGVTZXR0aW5nVGFiLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQge1xyXG5cdEFwcCxcclxuXHRFZGl0b3IsXHJcblx0RWRpdG9yUG9zaXRpb24sXHJcblx0RWRpdG9yU2VsZWN0aW9uT3JDYXJldCxcclxuXHRNb2RhbCxcclxuXHRQbHVnaW4sXHJcblx0VmlldyxcclxufSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHsgU2V0dGluZ1RhYiB9IGZyb20gXCIuL1NhbXBsZVNldHRpbmdUYWJcIjtcclxuXHJcbmludGVyZmFjZSBTZXR0aW5ncyB7XHJcblx0bXlTZXR0aW5nOiBzdHJpbmc7XHJcbn1cclxuXHJcbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IFNldHRpbmdzID0ge1xyXG5cdG15U2V0dGluZzogXCJkZWZhdWx0XCIsXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNeVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XHJcblx0c2V0dGluZ3M6IFNldHRpbmdzO1xyXG5cclxuXHRhc3luYyBvbmxvYWQoKSB7XHJcblx0XHRhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xyXG5cclxuXHRcdC8vIFRoaXMgYWRkcyBhIHNpbXBsZSBjb21tYW5kIHRoYXQgY2FuIGJlIHRyaWdnZXJlZCBhbnl3aGVyZVxyXG5cdFx0dGhpcy5hZGRDb21tYW5kKHtcclxuXHRcdFx0aWQ6IFwib3Blbi1zYW1wbGUtbW9kYWwtc2ltcGxlXCIsXHJcblx0XHRcdG5hbWU6IFwiT3BlbiBzYW1wbGUgbW9kYWwgKHNpbXBsZSlcIixcclxuXHRcdFx0ZWRpdG9yQ2FsbGJhY2s6IChlZGl0b3I6IEVkaXRvciwgdmlldzogVmlldykgPT4ge1xyXG5cdFx0XHRcdGNvbnN0IHF1ZXJ5ID0gXCJ0ZXN0XCI7XHJcblx0XHRcdFx0bmV3IEN1cnNvcnNNb2RhbCh0aGlzLmFwcCwgZWRpdG9yKS5vcGVuKCk7XHJcblx0XHRcdH0sXHJcblx0XHR9KTtcclxuXHRcdC8vIFRoaXMgYWRkcyBhIHNldHRpbmdzIHRhYiBzbyB0aGUgdXNlciBjYW4gY29uZmlndXJlIHZhcmlvdXMgYXNwZWN0cyBvZiB0aGUgcGx1Z2luXHJcblx0XHR0aGlzLmFkZFNldHRpbmdUYWIobmV3IFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcclxuXHR9XHJcblxyXG5cdG9udW5sb2FkKCkge31cclxuXHJcblx0YXN5bmMgbG9hZFNldHRpbmdzKCkge1xyXG5cdFx0dGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oXHJcblx0XHRcdHt9LFxyXG5cdFx0XHRERUZBVUxUX1NFVFRJTkdTLFxyXG5cdFx0XHRhd2FpdCB0aGlzLmxvYWREYXRhKClcclxuXHRcdCk7XHJcblx0fVxyXG5cclxuXHRhc3luYyBzYXZlU2V0dGluZ3MoKSB7XHJcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xyXG5cdH1cclxufVxyXG5cclxuY2xhc3MgQ3Vyc29yc01vZGFsIGV4dGVuZHMgTW9kYWwge1xyXG5cdGVkaXRvcjogRWRpdG9yO1xyXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBlZGl0b3I6IEVkaXRvcikge1xyXG5cdFx0c3VwZXIoYXBwKTtcclxuXHRcdHRoaXMuZWRpdG9yID0gZWRpdG9yO1xyXG5cdH1cclxuXHJcblx0YXN5bmMgZ2V0U2VsZWN0aW9uQW5kT2Zmc2V0KCkge1xyXG5cdFx0Y29uc3Qgc2VsZWN0aW9uID0gdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9uKCk7XHJcblx0XHRjb25zdCBvZmZzZXQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3IoXCJmcm9tXCIpLmxpbmU7XHJcblx0XHRpZiAoc2VsZWN0aW9uICE9PSBcIlwiKSB7XHJcblx0XHRcdHJldHVybiB7IHNlbGVjdGlvbiwgb2Zmc2V0IH07XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb25zdCBjdXJyRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcblx0XHRcdGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jYWNoZWRSZWFkKGN1cnJGaWxlKTtcclxuXHRcdFx0cmV0dXJuIHsgc2VsZWN0aW9uOiBjb250ZW50LCBvZmZzZXQ6IDAgfTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGdldFNlbGVjdGlvbnNGcm9tUXVlcnkoY29udGVudDogc3RyaW5nLCBvZmZzZXQ6IG51bWJlciwgcXVlcnk6IHN0cmluZykge1xyXG5cdFx0Y29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKHF1ZXJ5LCBcImdcIik7XHJcblx0XHRjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoXCJcXG5cIik7XHJcblx0XHRjb25zdCBzZWxlY3Rpb25zOiBFZGl0b3JTZWxlY3Rpb25PckNhcmV0W10gPSBbXTtcclxuXHJcblx0XHRsaW5lcy5mb3JFYWNoKChsaW5lLCBpKSA9PiB7XHJcblx0XHRcdGNvbnN0IG1hdGNoZXMgPSBsaW5lLm1hdGNoQWxsKHJlZ2V4KTtcclxuXHRcdFx0Y29uc3QgbWF0Y2hlc0FyciA9IFsuLi5tYXRjaGVzXTtcclxuXHJcblx0XHRcdG1hdGNoZXNBcnIuZm9yRWFjaCgobWF0Y2hBcnIpID0+IHtcclxuXHRcdFx0XHRjb25zdCBmcm9tID0gbWF0Y2hBcnIuaW5kZXg7XHJcblx0XHRcdFx0aWYgKGZyb20gIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0Y29uc3QgYW5jaG9yOiBFZGl0b3JQb3NpdGlvbiA9IHtcclxuXHRcdFx0XHRcdFx0Y2g6IGZyb20sXHJcblx0XHRcdFx0XHRcdGxpbmU6IGkgKyBvZmZzZXQsXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdFx0Y29uc3QgaGVhZDogRWRpdG9yUG9zaXRpb24gPSB7XHJcblx0XHRcdFx0XHRcdGNoOiBmcm9tICsgbWF0Y2hBcnJbMF0ubGVuZ3RoLFxyXG5cdFx0XHRcdFx0XHRsaW5lOiBpICsgb2Zmc2V0LFxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHRcdHNlbGVjdGlvbnMucHVzaCh7IGFuY2hvciwgaGVhZCB9KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIHNlbGVjdGlvbnM7XHJcblx0fVxyXG5cclxuXHRhc3luYyBvbk9wZW4oKSB7XHJcblx0XHRsZXQgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcblxyXG5cdFx0Y29uc3QgeyBzZWxlY3Rpb24sIG9mZnNldCB9ID0gYXdhaXQgdGhpcy5nZXRTZWxlY3Rpb25BbmRPZmZzZXQoKTtcclxuXHRcdGNvbnNvbGUubG9nKHsgc2VsZWN0aW9uIH0pO1xyXG5cclxuXHRcdGNvbnN0IGlucHV0RWwgPSBjb250ZW50RWwuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XHJcblx0XHRcdHR5cGU6IFwidGV4dFwiLFxyXG5cdFx0XHR0aXRsZTogXCJTZWFyY2ggUXVlcnlcIixcclxuXHRcdFx0YXR0cjogeyBwbGFjZWhvbGRlcjogXCJTZWFyY2ggUXVlcnlcIiB9LFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Y29uc3Qgc3VibWl0QnV0dG9uID0gY29udGVudEVsLmNyZWF0ZUVsKFxyXG5cdFx0XHRcImlucHV0XCIsXHJcblx0XHRcdHtcclxuXHRcdFx0XHR0eXBlOiBcInN1Ym1pdFwiLFxyXG5cdFx0XHRcdHRleHQ6IFwic3VibWl0XCIsXHJcblx0XHRcdH0sXHJcblx0XHRcdChzdWJtaXRFbCkgPT4ge1xyXG5cdFx0XHRcdHN1Ym1pdEVsLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XHJcblx0XHRcdFx0XHRjb25zdCBxdWVyeSA9IGlucHV0RWwudmFsdWU7XHJcblx0XHRcdFx0XHRjb25zdCBzZWxlY3Rpb25zID0gdGhpcy5nZXRTZWxlY3Rpb25zRnJvbVF1ZXJ5KFxyXG5cdFx0XHRcdFx0XHRzZWxlY3Rpb24sXHJcblx0XHRcdFx0XHRcdG9mZnNldCxcclxuXHRcdFx0XHRcdFx0cXVlcnlcclxuXHRcdFx0XHRcdCk7XHJcblxyXG5cdFx0XHRcdFx0Y29uc29sZS5sb2coeyBzZWxlY3Rpb25zIH0pO1xyXG5cdFx0XHRcdFx0dGhpcy5lZGl0b3Iuc2V0U2VsZWN0aW9ucyhzZWxlY3Rpb25zKTtcclxuXHRcdFx0XHRcdHRoaXMuY2xvc2UoKTtcclxuXHRcdFx0XHR9KTtcclxuXHRcdFx0fVxyXG5cdFx0KTtcclxuXHR9XHJcblxyXG5cdG9uQ2xvc2UoKSB7XHJcblx0XHRsZXQgeyBjb250ZW50RWwgfSA9IHRoaXM7XHJcblx0XHRjb250ZW50RWwuZW1wdHkoKTtcclxuXHR9XHJcbn1cclxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZyB9IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgTXlQbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuXHRwbHVnaW46IE15UGx1Z2luO1xyXG5cclxuXHRjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBNeVBsdWdpbikge1xyXG5cdFx0c3VwZXIoYXBwLCBwbHVnaW4pO1xyXG5cdFx0dGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcblx0fVxyXG5cclxuXHRkaXNwbGF5KCk6IHZvaWQge1xyXG5cdFx0bGV0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XHJcblxyXG5cdFx0Y29udGFpbmVyRWwuZW1wdHkoKTtcclxuXHJcblx0XHQvLyBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJTZXR0aW5ncyBmb3IgbXkgYXdlc29tZSBwbHVnaW4uXCIgfSk7XHJcblxyXG5cdFx0Ly8gbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcblx0XHQvLyBcdC5zZXROYW1lKFwiU2V0dGluZyAjMVwiKVxyXG5cdFx0Ly8gXHQuc2V0RGVzYyhcIkl0J3MgYSBzZWNyZXRcIilcclxuXHRcdC8vIFx0LmFkZFRleHQoKHRleHQpID0+IHRleHRcclxuXHRcdC8vIFx0XHQuc2V0UGxhY2Vob2xkZXIoXCJFbnRlciB5b3VyIHNlY3JldFwiKVxyXG5cdFx0Ly8gXHRcdC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5teVNldHRpbmcpXHJcblx0XHQvLyBcdFx0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xyXG5cdFx0Ly8gXHRcdFx0Y29uc29sZS5sb2coXCJTZWNyZXQ6IFwiICsgdmFsdWUpO1xyXG5cdFx0Ly8gXHRcdFx0dGhpcy5wbHVnaW4uc2V0dGluZ3MubXlTZXR0aW5nID0gdmFsdWU7XHJcblx0XHQvLyBcdFx0XHRhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuXHRcdC8vIFx0XHR9KVxyXG5cdFx0Ly8gXHQpO1xyXG5cdH1cclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQSx1QkFRTzs7O0FDUlAsc0JBQStDO0FBR3hDLCtCQUF5QixpQ0FBaUI7QUFBQSxFQUdoRCxZQUFZLEtBQVUsUUFBa0I7QUFDdkMsVUFBTSxLQUFLO0FBQ1gsU0FBSyxTQUFTO0FBQUE7QUFBQSxFQUdmLFVBQWdCO0FBQ2YsUUFBSSxFQUFFLGdCQUFnQjtBQUV0QixnQkFBWTtBQUFBO0FBQUE7OztBRENkLElBQU0sbUJBQTZCO0FBQUEsRUFDbEMsV0FBVztBQUFBO0FBR1osNkJBQXNDLHdCQUFPO0FBQUEsRUFHdEMsU0FBUztBQUFBO0FBQ2QsWUFBTSxLQUFLO0FBR1gsV0FBSyxXQUFXO0FBQUEsUUFDZixJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixnQkFBZ0IsQ0FBQyxRQUFnQixTQUFlO0FBQy9DLGdCQUFNLFFBQVE7QUFDZCxjQUFJLGFBQWEsS0FBSyxLQUFLLFFBQVE7QUFBQTtBQUFBO0FBSXJDLFdBQUssY0FBYyxJQUFJLFdBQVcsS0FBSyxLQUFLO0FBQUE7QUFBQTtBQUFBLEVBRzdDLFdBQVc7QUFBQTtBQUFBLEVBRUwsZUFBZTtBQUFBO0FBQ3BCLFdBQUssV0FBVyxPQUFPLE9BQ3RCLElBQ0Esa0JBQ0EsTUFBTSxLQUFLO0FBQUE7QUFBQTtBQUFBLEVBSVAsZUFBZTtBQUFBO0FBQ3BCLFlBQU0sS0FBSyxTQUFTLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFJM0IsaUNBQTJCLHVCQUFNO0FBQUEsRUFFaEMsWUFBWSxLQUFVLFFBQWdCO0FBQ3JDLFVBQU07QUFDTixTQUFLLFNBQVM7QUFBQTtBQUFBLEVBR1Qsd0JBQXdCO0FBQUE7QUFDN0IsWUFBTSxZQUFZLEtBQUssT0FBTztBQUM5QixZQUFNLFNBQVMsS0FBSyxPQUFPLFVBQVUsUUFBUTtBQUM3QyxVQUFJLGNBQWMsSUFBSTtBQUNyQixlQUFPLEVBQUUsV0FBVztBQUFBLGFBQ2Q7QUFDTixjQUFNLFdBQVcsS0FBSyxJQUFJLFVBQVU7QUFDcEMsY0FBTSxVQUFVLE1BQU0sS0FBSyxJQUFJLE1BQU0sV0FBVztBQUNoRCxlQUFPLEVBQUUsV0FBVyxTQUFTLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUl2Qyx1QkFBdUIsU0FBaUIsUUFBZ0IsT0FBZTtBQUN0RSxVQUFNLFFBQVEsSUFBSSxPQUFPLE9BQU87QUFDaEMsVUFBTSxRQUFRLFFBQVEsTUFBTTtBQUM1QixVQUFNLGFBQXVDO0FBRTdDLFVBQU0sUUFBUSxDQUFDLE1BQU0sTUFBTTtBQUMxQixZQUFNLFVBQVUsS0FBSyxTQUFTO0FBQzlCLFlBQU0sYUFBYSxDQUFDLEdBQUc7QUFFdkIsaUJBQVcsUUFBUSxDQUFDLGFBQWE7QUFDaEMsY0FBTSxPQUFPLFNBQVM7QUFDdEIsWUFBSSxTQUFTLFFBQVc7QUFDdkIsZ0JBQU0sU0FBeUI7QUFBQSxZQUM5QixJQUFJO0FBQUEsWUFDSixNQUFNLElBQUk7QUFBQTtBQUVYLGdCQUFNLE9BQXVCO0FBQUEsWUFDNUIsSUFBSSxPQUFPLFNBQVMsR0FBRztBQUFBLFlBQ3ZCLE1BQU0sSUFBSTtBQUFBO0FBRVgscUJBQVcsS0FBSyxFQUFFLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFLN0IsV0FBTztBQUFBO0FBQUEsRUFHRixTQUFTO0FBQUE7QUFDZCxVQUFJLEVBQUUsY0FBYztBQUVwQixZQUFNLEVBQUUsV0FBVyxXQUFXLE1BQU0sS0FBSztBQUN6QyxjQUFRLElBQUksRUFBRTtBQUVkLFlBQU0sVUFBVSxVQUFVLFNBQVMsU0FBUztBQUFBLFFBQzNDLE1BQU07QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQLE1BQU0sRUFBRSxhQUFhO0FBQUE7QUFHdEIsWUFBTSxlQUFlLFVBQVUsU0FDOUIsU0FDQTtBQUFBLFFBQ0MsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFNBRVAsQ0FBQyxhQUFhO0FBQ2IsaUJBQVMsaUJBQWlCLFNBQVMsTUFBWTtBQUM5QyxnQkFBTSxRQUFRLFFBQVE7QUFDdEIsZ0JBQU0sYUFBYSxLQUFLLHVCQUN2QixXQUNBLFFBQ0E7QUFHRCxrQkFBUSxJQUFJLEVBQUU7QUFDZCxlQUFLLE9BQU8sY0FBYztBQUMxQixlQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1ULFVBQVU7QUFDVCxRQUFJLEVBQUUsY0FBYztBQUNwQixjQUFVO0FBQUE7QUFBQTsiLAogICJuYW1lcyI6IFtdCn0K
