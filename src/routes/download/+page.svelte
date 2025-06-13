<script lang="ts">
  import { onMount } from "svelte";
  import { Mangapill } from "./_downloaders/Mangapill";
  import { Manga } from "./Manga";
  import { BaseDirectory, open } from "@tauri-apps/plugin-fs";

  async function download(): Promise<null | Manga> {
    const DOWNLOADERS = [Mangapill];

    let downloader: Mangapill | null = null;
    for (const _downloader of DOWNLOADERS) {
      if (_downloader.verify(url)) {
        downloader = new _downloader(url);
      }
    }

    if (downloader === null) {
      console.error("No suitable downloader found");
      return null;
    }

    const manga = await downloader.download(1, 2);
    console.log(manga);
    await manga.dump();
    await manga.destroy();

    return manga;
  }

  let url: string = $state("");

  onMount(async () => {
    console.log("mounted");
    const file = await open("manga\\Oshi No Ko.mga", {
      baseDir: BaseDirectory.AppData,
      read: true,
    });

    const manga = new Manga("Oshi No Ko", file);
    await manga.dump();
    await manga.destroy();
  });
</script>

<svelte:head>
  <title>Manga Viewer | Download</title>
</svelte:head>

<main>
  <h1>Download</h1>

  <label for="manga-url">
    <input name="manga-url" bind:value={url} />
  </label>

  <button onclick={download}>Download</button>
</main>
