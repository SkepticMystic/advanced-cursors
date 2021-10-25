<script lang="ts">
  import type { CursorsModal } from "src/CursorsModal";
  import type ACPlugin from "src/main";
  import { onMount } from "svelte";

  export let modal: CursorsModal;
  export let plugin: ACPlugin;

  let queryEl: HTMLInputElement;
  let flagsEl: HTMLInputElement;
  let regexQEl: HTMLInputElement;

  onMount(() => queryEl.focus());
</script>

<div class="inputEls">
  <input bind:this={queryEl} type="text" placeholder="Search Query" />
  <button
    class="AC-submit-button"
    on:click={() => {
      const q = {
        name: "",
        query: queryEl.value,
        flags: flagsEl.value,
        regexQ: regexQEl.checked,
      };
      modal.submit(q);
    }}>Submit</button
  >

  <input bind:this={flagsEl} type="text" placeholder="Regex flags" width="10" />
  <input bind:this={regexQEl} type="checkbox" name="regexQ" checked />
  <label for="regexQ">Regex</label>
</div>

<div class="savedQs">
  <ol>
    {#each plugin.settings.savedQueries as q}
      <li class="savedQ">
        <span
          class="savedQ-name"
          on:click={(e) => {
            modal.submit(q);
          }}
        >
          {q.name}
        </span>
        <span>→</span>
        <span
          class="savedQ-query"
          on:click={(e) => {
            modal.submit(q);
          }}
        >
          /{q.query}/{q.flags}
        </span>
      </li>
    {/each}
  </ol>
</div>

<style>
</style>
