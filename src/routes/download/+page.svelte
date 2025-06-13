<script lang="ts">
  import { Mangapill } from "./_downloaders/Mangapill";

  function handleErrors(error: string): void {
    console.error(error);
    errors.push(error);
  }

  async function download(): Promise<void> {
    const DOWNLOADERS = [Mangapill];

    errors = [];

    if (url === "") {
      return;
    }

    let downloader: Mangapill | null = null;
    for (const _downloader of DOWNLOADERS) {
      if (_downloader.verify(url)) {
        downloader = new _downloader(url);
      }
    }

    if (downloader === null) {
      const errorMessage = "Link not supported";

      handleErrors(errorMessage);

      return;
    }

    await downloader.download(1, 1, handleErrors);
  }

  let url: string = $state("");
  let errors: string[] = $state([]);
</script>

<svelte:head>
  <title>Manga Viewer | Download</title>
</svelte:head>
<main>
  <h1>Download</h1>

  <label for="manga-url">
    <input name="manga-url" bind:value={url} />
    <button onclick={download}>Download</button>
  </label>

  {#each errors as error}
    <span class="error">
      Error: {error}
    </span>
  {/each}

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
  }

  button {
    @include button.button;

    & {
      margin: 0.5em 0;
    }
  }
</style>
