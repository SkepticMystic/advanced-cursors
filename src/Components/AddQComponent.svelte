<script lang="ts">
  import { App, Notice } from "obsidian";
  import type { SavedQuery } from "src/interfaces";
  import type MyPlugin from "src/main";
  import type { AddQModal, SettingTab } from "src/SettingTab";
  import { onMount } from "svelte";

  export let app: App;
  export let plugin: MyPlugin;
  export let modal: AddQModal;
  export let settingsTab: SettingTab;
  export let existingQ: SavedQuery;
  export let i: number;

  let nameEl: HTMLInputElement;
  let queryEl: HTMLInputElement;
  let regexEl: HTMLInputElement;
  let flagsEl: HTMLInputElement;

  onMount(() => nameEl.focus());

  async function onClick(i: number) {
    console.log({ i });
    const name = nameEl.value;
    const query = queryEl.value;
    const { savedQueries } = plugin.settings;

    if (name === "" || query === "") {
      new Notice("Both 'name' and 'query' must have a value.");
      return;
    }

    if (i === -1 && savedQueries.findIndex((q) => q.name === name) > -1) {
      new Notice(`A query with named "${name}" already exists`);
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

      if (i > -1) {
        // Overwrite old Q
        plugin.settings.savedQueries[i] = newQ;
        new Notice(`${name} → ${query} updated.`);

        // Remove old command
        app.commands.removeCommand(`advanced-cursors:AC-${name} → ${query}`);
        app.commands.removeCommand(
          `advanced-cursors:AC-next-${name} → ${query}`
        );
      } else {
        plugin.settings.savedQueries.push(newQ);
        new Notice(`${name} → ${query} added.`);
      }
      await plugin.saveSettings();

      //   Refresh settings tab
      settingsTab.initExistingSavedQs(modal.savedQsDiv);

      //   Add new plugin command
      plugin.addACCommand(newQ);
      plugin.addSelectInstanceCommand(newQ);
      modal.close();
    }
  }
</script>

<div>
  <input
    bind:this={nameEl}
    value={existingQ.name}
    type="text"
    placeholder="Name"
  />
  <input
    bind:this={queryEl}
    value={existingQ.query}
    type="text"
    placeholder="Query"
  />
  <input
    bind:this={flagsEl}
    value={existingQ.flags}
    type="text"
    placeholder="Regex Flags"
  />
  <input
    bind:this={regexEl}
    checked={existingQ.regexQ}
    type="checkbox"
    name="regexQ"
  />
  <label for="regexQ">Regex</label>
</div>
<div>
  <button on:click={() => onClick(i)}>{i === -1 ? "Submit" : "Edit"}</button>
</div>
