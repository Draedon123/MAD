<script lang="ts">
  import type { Snippet } from "svelte";

  type Props = {
    header: Snippet;
  } & WithChildren;

  const { children, header }: Props = $props();
</script>

<div class="container">
  <div class="header">
    {@render header?.()}
  </div>
  <div class="rest">
    <div class="vertical-line"></div>
    {@render children?.()}
  </div>
</div>

<style lang="scss">
  @use "/src/styles/colours.scss";

  .rest {
    $indent: 3ch;
    position: relative;
    margin-left: $indent;
    width: calc(100% - $indent);
  }

  .vertical-line {
    $offset: 1ch;
    border-left: 2px solid colours.$secondary;
    left: -$offset;
    position: absolute;
    height: 100%;
  }
</style>
