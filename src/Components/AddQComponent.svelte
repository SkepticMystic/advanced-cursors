<script lang="ts">
  import { App, Editor, Notice } from "obsidian";
  import { CursorsModal } from "src/CursorsModal";
  import type MyPlugin from "src/main";
  import type { AddQModal, SettingTab } from "src/SettingTab";
  import { onMount } from "svelte";

  export let app: App;
  export let plugin: MyPlugin;
  export let modal: AddQModal;
  export let settingsTab: SettingTab;

  let nameEl: HTMLInputElement;
  let queryEl: HTMLInputElement;
  let regexEl: HTMLInputElement;
  let flagsEl: HTMLInputElement;

  onMount(() => nameEl.focus());

  async function onClick() {
    const name = nameEl.value;
    const query = queryEl.value;
    const { savedQueries } = plugin.settings;

    if (name === "" || query === "") {
      new Notice("Both 'name' and 'query' must have a value.");
      return;
    }

    if (savedQueries.findIndex((q) => q.name === name) > -1) {
      new Notice(`A query with named '${name}' already exists`);
    } else {
      // Add new query to settings
      const regexQ = regexEl.checked;
      const flags = flagsEl.value;
      const newQ = {
        name,
        query,
        regexQ,
        flags,
      };
      plugin.settings.savedQueries.push(newQ);
      await plugin.saveSettings();
      new Notice(`${name} → ${query} added.`);

      //   Refresh settings tab
      settingsTab.initExistingSavedQs(modal.savedQsDiv);

      //   Add new plugin command
      plugin.addCommand({
        id: `AC-${name}: ${query}`,
        name: `Run query: ${name} → ${query}`,
        editorCallback: async (editor: Editor) => {
          const cursorModal = new CursorsModal(app, editor, plugin);
          const { selection, offset } =
            await cursorModal.getSelectionAndOffset();
          cursorModal.submit(query, selection, offset, regexQ, flags);
        },
      });
      modal.close();
    }
  }
</script>

<input bind:this={nameEl} type="text" placeholder="Name" />
<input bind:this={queryEl} type="text" placeholder="Query" />
<input bind:this={flagsEl} type="text" placeholder="Regex Flags" />
<input bind:this={regexEl} type="checkbox" name="regexQ" />
<label for="regexQ">Regex</label>
<button on:click={onClick}>Submit</button>
