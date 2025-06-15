<script lang="ts">
  type Props = {
    chapterOnClick: (chapter: number) => unknown;
    chapterNames: number[];
    highlightedRange?: number[];
  };

  const {
    chapterOnClick,
    chapterNames,
    highlightedRange: unsortedRange = [],
  }: Props = $props();

  let highlightedRange = $derived(unsortedRange.toSorted((a, b) => a - b));
</script>

<div class="container">
  <!-- eslint-disable-next-line svelte/require-each-key -->
  {#each chapterNames as chapter}
    <button
      onclick={() => {
        chapterOnClick(chapter);
      }}
      class="chapter-select"
      class:highlighted={chapter >= highlightedRange[0] &&
        chapter <= highlightedRange[1]}>{chapter}</button>
  {/each}
</div>

<style lang="scss">
  @use "/src/styles/colours.scss";

  .container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .chapter-select {
    background: none;
    color: colours.$text-primary;
    border: 1px solid #4d4d4d;

    cursor: pointer;

    height: 2em;
    width: 10ch;

    &.highlighted {
      background-color: colours.$tertiary;
    }

    &:hover {
      background-color: colours.$primary;
      color: colours.$text-tertiary;
    }
  }
</style>
