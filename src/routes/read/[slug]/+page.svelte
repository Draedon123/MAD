<script lang="ts">
  import { Manga } from "$lib/Manga";
  import { exists, open } from "@tauri-apps/plugin-fs";
  import type { PageProps } from "./$types";
  import * as paths from "@tauri-apps/api/path";
  import { browser } from "$app/environment";
  import { writable } from "svelte/store";
  import ScrollManga from "./layouts/ScrollManga.svelte";
  import { settings } from "../../settings/settings";
  import FlipManga from "./layouts/FlipManga.svelte";
  import ChapterSelector from "$lib/components/chapterSelection/ChapterSelector.svelte";
  import { Window } from "@tauri-apps/api/window";

  let { data }: PageProps = $props();

  let manga = $derived(getManga(data.mangaName));
  const mangaToDestroy: Manga[] = $state([]);
  let chapterIndex = writable(0);
  let showChapters: boolean = $state(false);
  let mangaLayout = $settings["manga-layout"].value;

  $effect(() => {
    Window.getCurrent().setTitle(data.mangaName);
  });

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
</script>

<main>
  {#await manga}
    Loading manga...
  {:then manga}
    {#if manga === null}
      <span class="error">Manga not found</span>
    {:else}
      <h1>
        Reading {data.mangaName}
        {manga.chapterTable.getChapterByIndex($chapterIndex).name}
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
      {#if mangaLayout === "scroll"}
        <ScrollManga {manga} bind:chapterIndex={$chapterIndex} />
      {:else}
        <FlipManga {manga} bind:chapterIndex={$chapterIndex} />
      {/if}
    {/if}
  {:catch error}
    <span class="error">Error loading manga: {error}</span>
  {/await}
  <br />
</main>

<style lang="scss">
  @use "/src/styles/button.scss";

  .chapter-select-toggle {
    @include button.button;

    & {
      height: 1.5em;
      margin-bottom: 0.5em;
    }
  }
</style>
