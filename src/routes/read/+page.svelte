<script lang="ts">
  import { BaseDirectory, open, readDir } from "@tauri-apps/plugin-fs";
  import { Manga } from "$lib/Manga";
  import * as path from "@tauri-apps/api/path";
  import { onDestroy } from "svelte";
  import { browser } from "$app/environment";

  const mangaList = getManga();

  async function getManga(): Promise<Manga[]> {
    if (!browser) {
      return [];
    }

    const mangaList: Manga[] = [];
    const directory = await readDir("manga", {
      baseDir: BaseDirectory.AppData,
    });

    for (const entry of directory) {
      if (entry.isDirectory || !entry.name.endsWith(".mga")) {
        continue;
      }

      const mangaName = entry.name.slice(0, -".mga".length);
      const file = await open(await path.join("manga", entry.name), {
        baseDir: BaseDirectory.AppData,
      });

      const manga = new Manga(mangaName, file);
      await manga.initialise();

      mangaList.push(manga);
    }

    return mangaList;
  }

  onDestroy(async () => {
    await Promise.all((await mangaList).map((manga) => manga.destroy()));
  });
</script>

<svelte:head>
  <title>Manga Viewer | Browse</title>
</svelte:head>

<main>
  <h1>Read</h1>

  {#await mangaList}
    Loading manga...
  {:then mangaList}
    {#if mangaList.length > 0}
      <div class="mangaContainer">
        {#each mangaList as manga}
          {@render MangaComponent(manga)}
        {/each}
      </div>
    {:else}
      No manga downloaded. Download manga from the
      <a href="/download">Download Page</a>
    {/if}
  {:catch error}
    <span class="error">Error loading manga: {error}</span>
  {/await}
</main>

{#snippet MangaComponent(manga: Manga)}
  <a class="manga" href="/read/{encodeURIComponent(manga.name)}">
    <img
      class="cover-image"
      src={manga.coverImageSrc}
      alt="{manga.name} Cover Image"
    />

    <span class="manga-name">{manga.name}</span>
  </a>
{/snippet}

<style lang="scss">
  .mangaContainer {
    display: flex;
  }

  a {
    color: #b0b0b0;
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

    border: 2px solid #3d3d3d;
    border-radius: 1em;

    transition: scale 0.3s ease-in-out;

    &:hover {
      scale: 1.05;
    }

    .cover-image {
      width: 100%;
      border-radius: 5px;
    }

    .manga-name {
      width: 100%;
      padding: 0.2rem 0;

      &:hover {
        color: white;
      }
    }
  }
</style>
