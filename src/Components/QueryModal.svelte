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

<div class="saved">
  {#each plugin.settings.savedQueries as savedQ}
    <div>
      <span>
        {savedQ.name}
      </span>
      <span>
        {savedQ.query}
      </span>
    </div>
  {/each}
</div>

<style>
  .saved {
  }
</style>
