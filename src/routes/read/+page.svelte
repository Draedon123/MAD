<script lang="ts">
  import { Manga } from "$lib/Manga";
  import { Window } from "@tauri-apps/api/window";
  import {
    BaseDirectory,
    watchImmediate,
    type UnwatchFn,
  } from "@tauri-apps/plugin-fs";
  import { onDestroy, onMount } from "svelte";

  let mangaList: Promise<Manga[]> = $state(Manga.getAllInDirectory());
  let unwatch: UnwatchFn | null = null;

  onMount(async () => {
    Window.getCurrent().setTitle("MAD | Browse");

    unwatch = await watchImmediate(
      "manga",
      (event) => {
        if (!event.paths.some((path) => path.endsWith(".mga"))) {
          return;
        }

        mangaList = Manga.getAllInDirectory();
      },
      { baseDir: BaseDirectory.AppData }
    );
  });

  onDestroy(async () => {
    if (unwatch !== null) {
      unwatch();
    }

    await Promise.all((await mangaList).map((manga) => manga.destroy()));
  });
</script>

<main>
  <h1>Read</h1>

  {#await mangaList}
    Loading manga...
  {:then mangaList}
    <div class="mangaContainer">
      {#each mangaList as manga (manga.name)}
        {@render MangaComponent(manga)}
      {:else}
        No manga downloaded. Download manga from the
        <a href="/download" style="margin-left: 0.3ch">Download Page</a>
      {/each}
    </div>
  {:catch error}
    <span class="error">Error loading manga: {error}</span>
  {/await}
</main>

{#snippet MangaComponent(manga: Manga)}
  <a class="manga" href="/read/{encodeURIComponent(manga.name)}">
    <img
      class="cover-image"
      src={manga.coverImageSrc}
      alt="{manga.name} Cover Image" />

    <span class="manga-name">{manga.name}</span>
  </a>
{/snippet}

<style lang="scss">
  @use "/src/styles/colours.scss";

  .mangaContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  a {
    color: colours.$text-secondary;
    text-decoration: none;
    text-align: center;
    font-size: larger;
  }

  .manga {
    display: flex;
    flex-direction: column;
    align-items: center;

    width: min(100%, 200px);

    padding: 1ch;
    margin: 0.5ch;

    border: 2px solid #3d3d3d;
    border-radius: 1em;

    transition: scale 0.3s ease-in-out;

    &:hover {
      scale: 1.05;
      color: colours.$text-primary;
    }

    .cover-image {
      width: 100%;
      border-radius: 5px;
    }

    .manga-name {
      width: 100%;
      padding: 0.2rem 0;
    }
  }
</style>
