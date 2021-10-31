<script lang="ts">
  import type { Editor } from "obsidian";
  import type { IncrementingIModal } from "src/IncrementingIModal";

  import type ACPlugin from "src/main";
  import { onMount } from "svelte";

  export let plugin: ACPlugin;
  export let ed: Editor;
  export let modal: IncrementingIModal;

  let startInput: HTMLInputElement;
  let incInput: HTMLInputElement;
  let submitButton: HTMLButtonElement;

  function onSubmit() {
    const start = Number.parseFloat(startInput.value);
    const inc = Number.parseFloat(incInput.value);
    plugin.writeIncrementingI(ed, start, inc);
    modal.close();
  }

  onMount(() => {
    submitButton.focus();
  });
</script>

<div class="inputEls">
  <div>
    <label for="start">Start: </label>
    <input
      bind:this={startInput}
      value={1}
      name="start"
      type="number"
      placeholder="Search Query"
    />
  </div>

  <div>
    <label for="inc">Increment: </label>
    <input
      bind:this={incInput}
      value={1}
      name="inc"
      type="number"
      placeholder="Increment"
    />
  </div>
  <div>
    <button
      bind:this={submitButton}
      class="AC-submit-button"
      on:click={onSubmit}>Submit</button
    >
  </div>
</div>
