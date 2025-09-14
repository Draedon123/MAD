<script lang="ts">
  import { Manga } from "$lib/Manga";
  import { exists, open } from "@tauri-apps/plugin-fs";
  import type { PageProps } from "./$types";
  import * as paths from "@tauri-apps/api/path";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import type { MouseEventHandler } from "svelte/elements";
  import ChapterSelector from "$lib/components/chapterSelection/ChapterSelector.svelte";
  import { writable } from "svelte/store";

  let { data }: PageProps = $props();

  let manga = $derived(getManga(data.mangaName));
  const mangaToDestroy: Manga[] = $state([]);
  let chapterIndex = writable(0);
  let showChapters: boolean = $state(false);
  const eventListenerAbortController = new AbortController();

  chapterIndex.subscribe(() => {
    if (browser) {
      document.querySelector("main")?.scrollTo(0, 0);
    }
  });

  $effect(() => {
    if (mangaToDestroy.length > 1) {
      mangaToDestroy[0].destroy();
      mangaToDestroy.shift();
    }
  });

  async function getManga(mangaName: string): Promise<Manga | null> {
    if (!browser) {
      return null;
    }

    const filePath = await paths.join("manga", `${mangaName}.mga`);

    if (!(await exists(filePath, { baseDir: paths.BaseDirectory.AppData }))) {
      return null;
    }

    const file = await open(filePath, { baseDir: paths.BaseDirectory.AppData });
    const manga = new Manga(mangaName, file);

    await manga.initialise();

    $chapterIndex = 0;

    mangaToDestroy.push(manga);

    return manga;
  }

  async function navigateChapters(event: KeyboardEvent): Promise<void> {
    const resolvedManga = await manga;
    if (resolvedManga === null) {
      return;
    }

    switch (event.code) {
      case "ArrowLeft": {
        if ($chapterIndex <= 0) {
          break;
        }

        $chapterIndex--;
        break;
      }
      case "ArrowRight": {
        if ($chapterIndex >= resolvedManga.chapterTable.chapters.length) {
          break;
        }

        $chapterIndex++;
        break;
      }
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
  <title>MAD | Reading {data.mangaName}</title>
</svelte:head>

<main>
  {#await manga}
    Loading manga...
  {:then manga}
    {#if manga === null}
      <span class="error">Manga not found</span>
    {:else}
      <h1>
        Reading {data.mangaName} Chapter {manga.chapterTable.getChapterByIndex(
          $chapterIndex
        ).name}
      </h1>
      <button
        class="chapter-select-toggle"
        onclick={() => {
          showChapters = !showChapters;
        }}>{showChapters ? "Collapse" : "Expand"} Chapters</button>
      <div class="chapter-select-container" class:hidden={!showChapters}>
        <ChapterSelector
          chapterNames={manga.chapterTable.getChapterNames()}
          chapterOnClick={(index) => {
            $chapterIndex = index;
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
          {#await manga.getAllPages($chapterIndex)}
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
  @use "/src/styles/button.scss";

  .chapter-select-container {
    max-width: 95%;
  }

  .chapter-select-toggle {
    @include button.button;

    & {
      height: 1.5em;
      margin-bottom: 0.5em;
    }
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
