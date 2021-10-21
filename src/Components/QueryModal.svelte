<script lang="ts">
  import { onMount } from "svelte";
  import type { CursorsModal } from "src/CursorsModal";
  import type MyPlugin from "src/main";

  export let modal: CursorsModal;
  export let plugin: MyPlugin;

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
      console.log({ query });
      const { selection, offset } = await modal.getSelectionAndOffset();
      modal.submit(query, selection, offset, regexQEl.checked);
    }}>Submit</button
  >

  <input bind:this={regexQEl} type="checkbox" name="regexQ" checked />
  <label for="regexQ">Regex?</label>
</div>

<div class="savedQ">
  {#each plugin.settings.savedQueries as savedQ}
    <div>
      <span
        class="savedQ-name"
        on:click={async (e) => {
          console.log(e);
          const name = e.target.textContent;
          const { query } = plugin.settings.savedQueries.find(
            (savedQ) => savedQ.name === name
          );
          console.log({ query });
          const { selection, offset } = await modal.getSelectionAndOffset();
          modal.submit(query, selection, offset, regexQEl.checked);
        }}
      >
        {savedQ.name}
      </span>
      <span>: </span>
      <span
        class="savedQ-query"
        on:click={async (e) => {
          console.log(e);
          const query = e.target.textContent;
          console.log({ query });
          const { selection, offset } = await modal.getSelectionAndOffset();
          modal.submit(query, selection, offset, regexQEl.checked);
        }}
      >
        {savedQ.query}
      </span>
    </div>
  {/each}
</div>

<style>
  
</style>
