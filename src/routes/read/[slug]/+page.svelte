<script lang="ts">
  import { Manga } from "$lib/Manga";
  import { exists, open } from "@tauri-apps/plugin-fs";
  import type { PageProps } from "./$types";
  import * as paths from "@tauri-apps/api/path";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { MouseEventHandler } from "svelte/elements";
  import ChapterSelector from "$lib/components/chapterSelection/ChapterSelector.svelte";

  let { data }: PageProps = $props();

  const manga = getManga();
  const eventListenerAbortController = new AbortController();
  let chapter: number = $state(1);
  let showChapters: boolean = $state(false);

  async function getManga(): Promise<Manga | null> {
    if (!browser) {
      return null;
    }

    const filePath = await paths.join("manga", `${data.mangaName}.mga`);

    if (!(await exists(filePath, { baseDir: paths.BaseDirectory.AppData }))) {
      return null;
    }

    const file = await open(filePath, { baseDir: paths.BaseDirectory.AppData });
    const manga = new Manga(data.mangaName, file);

    await manga.initialise();

    return manga;
  }

  async function navigateChapters(event: KeyboardEvent): Promise<void> {
    const resolvedManga = await manga;
    if (resolvedManga === null) {
      return;
    }

    if (chapter > 1 && event.key === "ArrowLeft") {
      chapter--;
      return;
    }

    if (
      chapter < resolvedManga.chapterTable.chapters.length &&
      event.key === "ArrowRight"
    ) {
      chapter++;
      return;
    }
  }

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

  onMount(() => {
    document.addEventListener("keydown", navigateChapters);

    return async () => {
      await (await manga)?.destroy();
      eventListenerAbortController.abort();
      document.removeEventListener("keydown", navigateChapters);
    };
  });
</script>

<svelte:head>
  <title>Manga Viewer | Reading {data.mangaName}</title>
</svelte:head>

<main>
  <h1>Reading {data.mangaName} Chapter {chapter}</h1>

  {#await manga}
    Loading manga...
  {:then manga}
    {#if manga === null}
      <span class="error">Manga not found</span>
    {:else}
      <button
        class="chapter-select-toggle"
        onclick={() => {
          showChapters = !showChapters;
        }}>{showChapters ? "Collapse" : "Expand"} Chapters</button>
      <div class="chapter-select-container" class:hidden={!showChapters}>
        <ChapterSelector
          chapterNames={manga.chapterTable.getChapterNames()}
          chapterOnClick={(chapterName) => {
            chapter = chapterName;
          }} />
      </div>

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
          {#await manga.getAllPages(chapter)}
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
    {/if}
  {:catch error}
    <span class="error">Error loading manga: {error}</span>
  {/await}
  <br />
</main>

<style lang="scss">
  .chapter-select-container {
    max-width: 95%;
  }

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
      margin: 1em 0;
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
