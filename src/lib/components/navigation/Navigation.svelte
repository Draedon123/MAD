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
      }}
    ></button>
  </div>
  <div class="links" class:hidden={closed}>
    {@render children?.()}
  </div>
</nav>

<style lang="scss">
  @use "sass:color" as colour;

  .sidebar {
    $background-colour: #272727;
    $scrollbar-track-colour: colour.mix($background-colour, white, 90%);
    $scrollbar-button-colour: #b6b6b6;
    $scrollbar-thumb-colour: #808080;

    display: inline-block;
    height: 100vh;
    width: 20vw;

    padding-left: 1ch;

    background-color: $background-colour;

    overflow: hidden scroll;
    // https://easings.net/#easeOutQuart
    transition: width 1s cubic-bezier(0.25, 1, 0.5, 1);

    &::-webkit-scrollbar {
      width: 1ch;
    }

    &::-webkit-scrollbar-track {
      background-color: $scrollbar-track-colour;
    }

    &::-webkit-scrollbar-thumb {
      background-color: $scrollbar-thumb-colour;
      border-radius: 9999px;

      &:hover {
        background-color: colour.mix($scrollbar-thumb-colour, white, 80%);
      }
    }

    &::-webkit-scrollbar-button:vertical {
      &:start:decrement {
        background:
          linear-gradient(120deg, $scrollbar-track-colour 40%, #0000 41%),
          linear-gradient(240deg, $scrollbar-track-colour 40%, #0000 41%),
          linear-gradient(0deg, $scrollbar-track-colour 30%, #0000 31%);
        background-color: $scrollbar-button-colour;
      }

      &:end:increment {
        background:
          linear-gradient(300deg, $scrollbar-track-colour 40%, #0000 41%),
          linear-gradient(60deg, $scrollbar-track-colour 40%, #0000 41%),
          linear-gradient(180deg, $scrollbar-track-colour 30%, #0000 31%);
        background-color: $scrollbar-button-colour;
      }
    }
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
    transition: transform 1s ease-out;

    &:before,
    &:after {
      content: "";
      border-right: 4px solid white;

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

  .hidden {
    display: none;
  }
</style>
