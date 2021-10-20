import {
	App,
	Editor,
	EditorPosition,
	EditorSelectionOrCaret,
	Modal,
	Plugin,
	View,
} from "obsidian";
import { SettingTab } from "./SampleSettingTab";

interface Settings {
	mySetting: string;
}

const DEFAULT_SETTINGS: Settings = {
	mySetting: "default",
};

export default class MyPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			editorCallback: (editor: Editor, view: View) => {
				const query = "test";
				new CursorsModal(this.app, editor).open();
			},
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CursorsModal extends Modal {
	editor: Editor;
	constructor(app: App, editor: Editor) {
		super(app);
		this.editor = editor;
	}

	async getSelectionAndOffset() {
		const selection = this.editor.getSelection();
		const offset = this.editor.getCursor("from").line;
		if (selection !== "") {
			return { selection, offset };
		} else {
			const currFile = this.app.workspace.getActiveFile();
			const content = await this.app.vault.cachedRead(currFile);
			return { selection: content, offset: 0 };
		}
	}

	getSelectionsFromQuery(content: string, offset: number, query: string) {
		const regex = new RegExp(query, "g");
		const lines = content.split("\n");
		const selections: EditorSelectionOrCaret[] = [];

		lines.forEach((line, i) => {
			const matches = line.matchAll(regex);
			const matchesArr = [...matches];

			matchesArr.forEach((matchArr) => {
				const from = matchArr.index;
				if (from !== undefined) {
					const anchor: EditorPosition = {
						ch: from,
						line: i + offset,
					};
					const head: EditorPosition = {
						ch: from + matchArr[0].length,
						line: i + offset,
					};
					selections.push({ anchor, head });
				}
			});
		});

		return selections;
	}

	async onOpen() {
		let { contentEl } = this;

		const { selection, offset } = await this.getSelectionAndOffset();
		console.log({ selection });

		const inputEl = contentEl.createEl("input", {
			type: "text",
			title: "Search Query",
			attr: { placeholder: "Search Query" },
		});

		const submitButton = contentEl.createEl(
			"input",
			{
				type: "submit",
				text: "submit",
			},
			(submitEl) => {
				submitEl.addEventListener("click", async () => {
					const query = inputEl.value;
					const selections = this.getSelectionsFromQuery(
						selection,
						offset,
						query
					);

					console.log({ selections });
					this.editor.setSelections(selections);
					this.close();
				});
			}
		);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
