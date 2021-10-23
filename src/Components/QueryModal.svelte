<script lang="ts">
  import type { CursorsModal } from "src/CursorsModal";
  import type ACPlugin from "src/main";
  import { onMount } from "svelte";

  export let modal: CursorsModal;
  export let plugin: ACPlugin;

  let inputEl: HTMLInputElement;
  let regexQEl: HTMLInputElement;

  onMount(() => inputEl.focus());
</script>

<div class="inputEls">
  <input bind:this={inputEl} type="text" placeholder="Search Query" />
  <button
    on:click={() => {
      const query = inputEl.value;
      const q = { name: "", query, flags: "", regexQ: regexQEl.checked };
      const { selection, offset } = modal.getSelectionAndOffset();
      modal.submit(q, selection, offset);
    }}>Submit</button
  >

  <input bind:this={regexQEl} type="checkbox" name="regexQ" checked />
  <label for="regexQ">Regex</label>
</div>

<div class="savedQs">
  <ol>
    {#each plugin.settings.savedQueries as savedQ}
      <li class="savedQ">
        <span
          class="savedQ-name"
          on:click={(e) => {
            // @ts-ignore
            const name = e.target.textContent;
            const q = plugin.settings.savedQueries.find(
              (savedQ) => savedQ.name === name
            );

            const { selection, offset } = modal.getSelectionAndOffset();
            modal.submit(q, selection, offset);
          }}
        >
          {savedQ.name}
        </span>
        <span>→</span>
        <span
          class="savedQ-query"
          on:click={(e) => {
            // @ts-ignore
            const query = e.target.textContent;
            const q = plugin.settings.savedQueries.find(
              (savedQ) => savedQ.query === query
            );
            const { selection, offset } = modal.getSelectionAndOffset();
            modal.submit(q, selection, offset);
          }}
        >
          {savedQ.query}
        </span>
      </li>
    {/each}
  </ol>
</div>

<style>
</style>
