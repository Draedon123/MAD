<script lang="ts">
  import { Manga } from "$lib/Manga";
  import { exists, open } from "@tauri-apps/plugin-fs";
  import type { PageProps } from "./$types";
  import * as paths from "@tauri-apps/api/path";
  import { onDestroy, onMount } from "svelte";
  import { browser } from "$app/environment";

  let { data }: PageProps = $props();

  const manga = getManga();
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

  onMount(async () => {
    document.addEventListener("keydown", navigateChapters);
  });

  onDestroy(async () => {
    await (await manga)?.destroy();
    document.removeEventListener("keydown", navigateChapters);
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
        }}>{showChapters ? "Collapse" : "Expand"} Chapters</button
      >
      <div class="chapter-select-container" class:hidden={!showChapters}>
        {#each manga.chapterTable.getChapterNames() as chapterName}
          <button
            onclick={() => {
              chapter = chapterName;
            }}
            class="chapter-select">{chapterName}</button
          >
        {/each}
      </div>

      <div class="pages">
        {#await manga.getAllPages(chapter)}
          Loading pages...
        {:then pages}
          {#each pages as pageSrc, i}
            <img class="page" src={pageSrc} alt="Page {i + 1}" />
          {/each}
        {:catch error}
          {error}
        {/await}
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
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .chapter-select {
    background: none;
    color: white;
    border: 1px solid #4d4d4d;

    cursor: pointer;

    height: 2em;
    width: 10ch;

    &:hover {
      background-color: #3d3d3d;
    }
  }

  .pages {
    width: 100%;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    align-items: center;

    img.page {
      width: 95%;
      margin: 1em 0;
    }
  }
</style>
