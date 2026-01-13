<script lang="ts">
  import type { Manga } from "$lib/Manga";
  import { onMount } from "svelte";
  import type { MouseEventHandler } from "svelte/elements";

  type Props = {
    manga: Manga;
    chapterIndex: number;
  };

  let { manga, chapterIndex = $bindable() }: Props = $props();

  const eventListenerAbortController = new AbortController();

  async function navigateChapters(event: KeyboardEvent): Promise<void> {
    switch (event.code) {
      case "ArrowLeft": {
        if (chapterIndex <= 0) {
          break;
        }

        chapterIndex--;
        break;
      }

      case "ArrowRight": {
        if (chapterIndex >= manga.chapterTable.chapters.length - 1) {
          break;
        }

        chapterIndex++;
        break;
      }

      case "Home": {
        const mainElement = document.querySelector("main");

        if (mainElement === null) {
          throw new Error("Could not find main element");
        }

        mainElement.scroll(0, 0);
        break;
      }

      case "End": {
        const mainElement = document.querySelector("main");

        if (mainElement === null) {
          throw new Error("Could not find main element");
        }

        mainElement.scroll(0, mainElement.scrollHeight);
        break;
      }
    }
  }

  onMount(() => {
    document.addEventListener("keydown", navigateChapters);

    return async () => {
      await manga?.destroy();
      eventListenerAbortController.abort();
      document.removeEventListener("keydown", navigateChapters);
    };
  });

  const resizersOnMouseDown: MouseEventHandler<HTMLDivElement> = (
    event
  ): void => {
    event.preventDefault();
    const element = event.currentTarget.parentElement as HTMLElement;
    const direction = event.currentTarget.getAttribute("data-direction");
    const minimumWidth = 100;

    if (direction !== "left" && direction !== "right") {
      console.warn(`Unspecified resize direction "${direction}"`);
      return;
    }

    window.addEventListener("mousemove", resize, {
      signal: eventListenerAbortController.signal,
    });
    window.addEventListener("mouseup", stopResize, {
      signal: eventListenerAbortController.signal,
    });

    function resize(event: MouseEvent): void {
      switch (direction) {
        case "left": {
          const width = Math.max(
            minimumWidth,
            element.clientWidth -
              (event.pageX - element.getBoundingClientRect().left) * 2
          );
          element.style.width = `${width}px`;

          break;
        }
        case "right": {
          const width = Math.max(
            minimumWidth,
            element.clientWidth -
              (element.getBoundingClientRect().right - event.pageX) * 2
          );
          element.style.width = `${width}px`;

          break;
        }
      }
    }

    function stopResize(): void {
      window.removeEventListener("mousemove", resize);
    }
  };
</script>

<div class="centre-contents">
  <div class="pages">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="resizer"
      data-direction="left"
      onmousedown={resizersOnMouseDown}>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="resizer"
      data-direction="right"
      onmousedown={resizersOnMouseDown}>
    </div>
    {#await manga.getAllPages(chapterIndex)}
      <span class="centre-text">Loading pages...</span>
    {:then pages}
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each pages as pageSrc, i}
        <img class="page" src={pageSrc} alt="Page {i + 1}" />
      {/each}
    {:catch error}
      {error}
    {/await}
  </div>
</div>

<style lang="scss">
  .centre-contents {
    // - 1ch for left margin of page
    width: calc(100% - 1ch);

    display: flex;
    justify-content: center;
  }

  .centre-text {
    text-align: center;
  }

  .pages {
    width: 95%;
    display: flex;
    flex-direction: column;
    position: relative;

    img.page {
      width: 100%;
      margin: 1% 0;
      pointer-events: none;
    }
  }

  .resizer {
    $width: 2ch;
    // account for page margins
    height: calc(100% - 2em);
    top: 1em;
    width: $width;
    cursor: ew-resize;
    position: absolute;

    &[data-direction="left"] {
      left: calc(-0.5 * $width);
    }

    &[data-direction="right"] {
      right: calc(-0.5 * $width);
    }
  }
</style>
