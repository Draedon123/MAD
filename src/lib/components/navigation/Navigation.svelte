<script lang="ts">
  type Props = {
    closed?: boolean;
  } & WithChildren;

  let { children, closed = $bindable(false) }: Props = $props();
</script>

<nav class="sidebar" class:closed>
  <div class="top-panel">
    <button
      class="close arrow"
      class:flip-arrow={closed}
      aria-label="Close"
      onclick={() => {
        closed = !closed;
      }}></button>
  </div>
  <div class="links" class:hidden={closed}>
    {@render children?.()}
  </div>
</nav>

<style lang="scss">
  @use "sass:color" as colour;
  @use "/src/styles/scrollbar.scss";

  $transition-time: 0.5s;
  .sidebar {
    $background-colour: #272727;
    $scrollbar-track-colour: colour.mix($background-colour, #fff, 90%);

    @include scrollbar.scrollbar($scrollbar-track-colour);

    display: inline-block;
    height: 100vh;
    width: 20vw;

    padding-left: 1ch;

    background-color: $background-colour;

    overflow: hidden scroll;
    // https://easings.net/#easeOutQuart
    transition: width $transition-time cubic-bezier(0.25, 1, 0.5, 1);
  }

  .sidebar.closed {
    width: 1em;
    overflow-y: hidden;
  }

  .close {
    cursor: pointer;
  }

  .arrow {
    position: relative;
    display: block;
    width: 2em;
    height: 2em;
    float: right;
    background: none;
    border: none;
    transition: transform $transition-time ease-out;

    &:before,
    &:after {
      content: "";
      border-right: 4px solid #fff;

      height: 50%;
      margin-top: -30%;
      position: absolute;
      top: 40%;
      left: 40%;
    }

    &::before {
      rotate: 45deg;
    }

    &::after {
      margin-top: 0;
      rotate: -45deg;
    }

    &.flip-arrow {
      transform: scaleX(-1);
    }
  }

  .top-panel {
    display: inline-block;
    width: 100%;
  }

  .links {
    width: calc(100% - 1ch);
  }
</style>
