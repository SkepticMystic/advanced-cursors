<script lang="ts">
  import { App, Notice } from "obsidian";
  import { MODES } from "src/const";
  import type ACPlugin from "src/main";
  import type { ACSettingTab, AddQModal } from "src/SettingTab";
  import { blankQ, removeQCmds } from "src/utils";
  import { onMount } from "svelte";

  export let app: App;
  export let plugin: ACPlugin;
  export let modal: AddQModal;
  export let settingsTab: ACSettingTab;
  export let i: number;

  let existingQ = blankQ();
  if (i > -1) {
    existingQ = plugin.settings.savedQueries[i];
  }

  let nameEl: HTMLInputElement;
  let queryEl: HTMLInputElement;
  let regexEl: HTMLInputElement;
  let flagsEl: HTMLInputElement;

  onMount(() => nameEl.focus());

  async function submitOrEdit(i: number) {
    const name = nameEl.value;
    const query = queryEl.value;
    const { savedQueries } = plugin.settings;

    if (name === "" || query === "") {
      new Notice("Both 'name' and 'query' must have a value.");
      return;
    }

    if (i === -1 && savedQueries.findIndex((q) => q.name === name) > -1) {
      new Notice(`A query with named "${name}" already exists`);
      return;
    } else {
      const oldQ = savedQueries[i];

      // Add new query to settings
      const regexQ = regexEl.checked;
      const flags = flagsEl.value;
      const newQ = { name, query, regexQ, flags };

      if (i > -1) {
        removeQCmds(app, oldQ);

        plugin.settings.savedQueries[i] = newQ;
        new Notice(`${name} → ${query} updated.`);
      } else {
        plugin.settings.savedQueries.push(newQ);
        new Notice(`${name} → ${query} added.`);
      }
      await plugin.saveSettings();

      settingsTab.initExistingSavedQs(modal.savedQsDiv);

      MODES.forEach((mode) => plugin.addCmd(newQ, mode));

      plugin.view.draw();
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
  <button class="AC-submit-button" on:click={() => submitOrEdit(i)}
    >{i === -1 ? "Submit" : "Edit"}</button
  >
</div>
