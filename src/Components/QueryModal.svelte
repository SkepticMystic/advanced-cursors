<script lang="ts">
  import type { Editor } from "obsidian";
  import { displayRegex } from "src/utils";

  import type { CursorsModal } from "src/CursorsModal";
  import type ACPlugin from "src/main";
  import { onMount } from "svelte";
  import type { Query, Mode } from "src/interfaces";

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

  function runSavedQ(q: Query, mode: Mode) {
    plugin.selectInstance(editor, false, mode, q);
    modal.close();
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
        <span on:click={() => runSavedQ(q, "All")}>
          <span class="savedQ-name">
            {q.name}
          </span>
          <span>→</span>
          <span class="savedQ-query">
            {displayRegex(q)}
          </span>
        </span>
        <button
          aria-label="Next"
          class="savedQ-nextOrPrev"
          on:click={() => runSavedQ(q, "Next")}>→</button
        >
        <button
          aria-label="Previous"
          class="savedQ-nextOrPrev"
          on:click={() => runSavedQ(q, "Prev")}>←</button
        >
      </li>
    {/each}
  </ol>
</div>

<style>
  button.savedQ-nextOrPrev {
    float: right;
    width: fit-content;
    padding: 6px;
  }
</style>
