import {
	App,
	Editor,
	EditorPosition,
	EditorRange,
	EditorSelectionOrCaret,
	Modal,
	Notice,
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
		console.log("Loading advanced cursors");

		await this.loadSettings();

		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			editorCallback: (editor: Editor, view: View) => {
				new CursorsModal(this.app, editor).open();
			},
		});

		this.addCommand({
			id: "move-to-next-match",
			name: "Move to next instance of current selection",
			editorCallback: async (editor: Editor) => {
				this.selectNextInstance(editor);
			},
		});
		this.addSettingTab(new SettingTab(this.app, this));
	}

	async selectNextInstance(editor: Editor) {
		const currFile = this.app.workspace.getActiveFile();
		const content = await this.app.vault.read(currFile);

		const currSelection = editor.getSelection();
		const currPos = editor.getCursor("to");

		console.log({ content, currSelection, currPos });

		const currSelections: EditorSelectionOrCaret[] =
			editor.listSelections();
		const currOffset = editor.posToOffset(currPos);

		// const slice = content.slice(currOffset);

		const nextI = content.indexOf(currSelection, currOffset);

		console.log({ currOffset, nextI });

		if (nextI > -1) {
			const ch = nextI;
			const { line } = currPos;
			const anchor: EditorPosition = {
				ch,
				line,
			};
			const head: EditorPosition = {
				ch: ch + currSelection.length,
				line,
			};

			currSelections.push({ anchor, head });
			console.log({ anchor, head, currSelections });

			editor.setSelections([{ anchor, head }]);
			console.log(editor.listSelections());
		}
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
	regexQ: boolean;

	constructor(app: App, editor: Editor) {
		super(app);
		this.editor = editor;
		this.regexQ = true;
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

	getSelectionsFromQuery(
		content: string,
		offset: number,
		query: string,
		regexQ: boolean
	) {
		let regex: RegExp;
		if (regexQ) {
			regex = new RegExp(query, "g");
		} else {
			regex = new RegExp(
				query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
				"g"
			);
		}

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

		const inputDiv = contentEl.createDiv({ cls: "inputDiv" });

		const inputEl = inputDiv.createEl("input", {
			type: "text",
			title: "Search Query",
			attr: { placeholder: "Search Query" },
		});
		inputEl.focus();

		const submitButton = inputDiv.createEl(
			"input",
			{
				type: "submit",
				text: "submit",
			},
			(submitEl) => {
				submitEl.addEventListener("click", async () => {
					try {
						const query = inputEl.value;
						console.log(this.regexQ);
						const selections = this.getSelectionsFromQuery(
							selection,
							offset,
							query,
							this.regexQ
						);

						console.log({ selections });
						new Notice(`${selections.length} matches found.`);

						this.editor.setSelections(selections);
						this.close();
					} catch (error) {
						console.log(error);
						new Notice(
							"Something went wrong, check the console for the error."
						);
					}
				});
			}
		);

		const optionsDiv = contentEl.createDiv({ cls: "optionsDiv" });

		optionsDiv.createEl(
			"input",
			{
				type: "checkbox",
				attr: { name: "regexQ", checked: this.regexQ },
			},
			(regexQInput) => {
				regexQInput.addEventListener("change", () => {
					this.regexQ = regexQInput.checked;
				});
			}
		);
		optionsDiv.createEl("label", {
			text: "Regex?",
			attr: { for: "regexQ" },
		});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
