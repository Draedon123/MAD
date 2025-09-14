<script lang="ts">
  import ChapterSelector from "$lib/components/chapterSelection/ChapterSelector.svelte";
  import type { Downloader } from "./_downloaders/Downloader";
  import { Mangapill } from "./_downloaders/Mangapill";

  let url: string = $state("");
  let statusMessage: string = $state("");
  let errors: string[] = $state([]);
  let chapterNames: number[] = $state([]);
  let chapterDownloadRange: [number, number] = $state([0, 0]);
  let disableInputs: boolean = $state(false);
  let readyToDownload: boolean = false;
  let lastURL: string = "";

  function handleErrors(error: string): void {
    console.error(error);
    errors.push(error);
  }

  async function downloadButtonOnClick(): Promise<void> {
    if (url === "") {
      return;
    }

    const downloader = getDownloader(url);

    if (downloader === null) {
      const errorMessage = "Link not supported";
      handleErrors(errorMessage);
      return;
    }

    if (readyToDownload) {
      if (lastURL !== url) {
        readyToDownload = false;
        // hide chapter select
        chapterNames = [];
        downloadButtonOnClick();

        return;
      }

      disableInputs = true;
      // hide chapter select
      chapterNames = [];
      statusMessage = "Downloading manga. Do not leave this page";

      await download(chapterDownloadRange, downloader);

      chapterDownloadRange = [0, 0];
      statusMessage = "Manga finished downloading";
      disableInputs = false;
      readyToDownload = false;
    } else {
      disableInputs = true;

      statusMessage = "Fetching chapter names";
      chapterNames = await downloader.getChapterNames();
      statusMessage =
        "Select chapters to download. Click download button again to download selected range";

      lastURL = url;
      disableInputs = false;
      readyToDownload = true;
    }
  }

  function getDownloader(url: string) {
    const DOWNLOADERS = [Mangapill];

    let downloader: Mangapill | null = null;
    for (const _downloader of DOWNLOADERS) {
      if (_downloader.verify(url)) {
        downloader = new _downloader(url);
      }
    }

    return downloader;
  }

  function chapterSelectorOnClick(chapterIndex: number): void {
    chapterDownloadRange.shift();
    chapterDownloadRange.push(chapterIndex);
  }

  async function download(
    chapterRange: [number, number],
    downloader: Downloader
  ): Promise<void> {
    errors = [];

    await downloader.download(chapterRange[0], chapterRange[1], handleErrors);
  }
</script>

<svelte:head>
  <title>MAD | Download</title>
</svelte:head>
<main>
  <h1>Download</h1>

  <label for="manga-url">
    <input name="manga-url" disabled={disableInputs} bind:value={url} />
    <button onclick={downloadButtonOnClick} disabled={disableInputs}
      >Download</button>
  </label>

  <span class="status">
    {statusMessage}
  </span>

  <!-- eslint-disable-next-line svelte/require-each-key -->
  {#each errors as error}
    <span class="error">
      Error: {error}
    </span>
  {/each}

  <ChapterSelector
    {chapterNames}
    chapterOnClick={chapterSelectorOnClick}
    highlightedRange={chapterDownloadRange} />

  <section>
    <h2>Supported Links</h2>
    <ul>
      <li>Mangapill (https://mangapill.com/)</li>
    </ul>
  </section>
</main>

<style lang="scss">
  @use "/src/styles/input.scss";
  @use "/src/styles/button.scss";

  input {
    @include input.input;
    @include input.input-disabled;
  }

  button {
    @include button.button;
    @include button.button-disabled;

    & {
      margin: 0.5em 0;
    }
  }

  .error {
    margin: 0.5em 0;
  }

  .status {
    display: block;
  }
</style>
