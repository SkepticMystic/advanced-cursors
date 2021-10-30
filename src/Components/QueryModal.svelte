<script lang="ts">
  import type { Editor } from "obsidian";
  import { displayRegex } from "src/utils";

  import type { CursorsModal } from "src/CursorsModal";
  import type ACPlugin from "src/main";
  import { onMount } from "svelte";

  export let modal: CursorsModal;
  export let plugin: ACPlugin;
  export let editor: Editor;

  const { lastQ } = plugin.settings;

  let queryEl: HTMLInputElement;
  let flagsEl: HTMLInputElement;
  let regexQEl: HTMLInputElement;

  async function clickSearch() {
    const q = {
      name: "",
      query: queryEl.value,
      flags: flagsEl.value,
      regexQ: regexQEl.checked,
    };
    plugin.selectInstance(editor, false, "All", q);
    modal.close();
    plugin.settings.lastQ = q;
    await plugin.saveSettings();
  }

  onMount(() => {
    queryEl.focus();
    queryEl.select();
  });
</script>

<div class="inputEls">
  <input
    bind:this={queryEl}
    value={lastQ.query}
    type="text"
    placeholder="Search Query"
  />
  <button class="AC-submit-button" on:click={clickSearch}>Submit</button>

  <input
    bind:this={flagsEl}
    value={lastQ.flags}
    type="text"
    placeholder="Regex flags"
    width="10"
  />
  <input
    bind:this={regexQEl}
    type="checkbox"
    name="regexQ"
    checked={lastQ.regexQ}
  />
  <label for="regexQ">Regex</label>
</div>

<div class="savedQs">
  <ol>
    {#each plugin.settings.savedQueries as q}
      <li class="savedQ">
        <span
          class="savedQ-name"
          on:click={() => {
            plugin.selectInstance(editor, false, "All", q);
            modal.close();
          }}
        >
          {q.name}
        </span>
        <span>→</span>
        <span
          class="savedQ-query"
          on:click={() => {
            plugin.selectInstance(editor, false, "All", q);
            modal.close();
          }}
        >
          {displayRegex(q)}
        </span>
      </li>
    {/each}
  </ol>
</div>

<style>
</style>
