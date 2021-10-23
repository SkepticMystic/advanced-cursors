<script lang="ts">
  import { onMount } from "svelte";
  import type { CursorsModal } from "src/CursorsModal";
  import type ACPlugin from "src/main";

  export let modal: CursorsModal;
  export let plugin: ACPlugin;

  let inputEl: HTMLInputElement;
  let submitButton: HTMLButtonElement;
  let regexQEl: HTMLInputElement;

  onMount(() => inputEl.focus());
</script>

<div class="inputEls">
  <input bind:this={inputEl} type="text" placeholder="Search Query" />
  <button
    on:click={async () => {
      const query = inputEl.value;
      const { selection, offset } = await modal.getSelectionAndOffset();
      modal.submit(query, selection, offset, regexQEl.checked);
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
          on:click={async (e) => {
            // @ts-ignore
            const name = e.target.textContent;
            const { query, regexQ, flags } = plugin.settings.savedQueries.find(
              (savedQ) => savedQ.name === name
            );

            const { selection, offset } = await modal.getSelectionAndOffset();
            modal.submit(query, selection, offset, regexQ, flags);
          }}
        >
          {savedQ.name}
        </span>
        <span>→</span>
        <span
          class="savedQ-query"
          on:click={async (e) => {
            // @ts-ignore
            const query = e.target.textContent;
            const { regexQ, flags } = plugin.settings.savedQueries.find(
              (savedQ) => savedQ.query === query
            );
            const { selection, offset } = await modal.getSelectionAndOffset();
            modal.submit(query, selection, offset, regexQ, flags);
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
