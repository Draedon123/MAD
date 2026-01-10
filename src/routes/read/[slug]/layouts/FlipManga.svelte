<script lang="ts">
  import type { Manga } from "$lib/Manga";

  type Props = {
    manga: Manga;
    chapterIndex: number;
  };

  let { manga, chapterIndex = $bindable() }: Props = $props();
  let pageNumber = $state(0);
  let pages = $derived(
    manga.getAllPages(chapterIndex).then((pages) => {
      pageNumber = 0;
      return pages;
    })
  );
  let pageCount = $derived(
    manga.chapterTable.getChapterByIndex(chapterIndex).pageCount
  );

  function documentOnKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case "ArrowLeft": {
        if (pageNumber === 0) {
          if (chapterIndex === 0) {
            break;
          }

          chapterIndex--;
          pageNumber = pageCount - 1;
        } else {
          pageNumber--;
        }

        break;
      }

      case "ArrowRight": {
        if (pageNumber === pageCount - 1) {
          if (chapterIndex === manga.chapterTable.chapters.length - 1) {
            break;
          }

          chapterIndex++;
          pageNumber = 0;
        } else {
          pageNumber++;
        }

        break;
      }

      case "Home": {
        pageNumber = 0;
        event.preventDefault();

        break;
      }

      case "End": {
        pageNumber = pageCount - 1;
        event.preventDefault();

        break;
      }
    }
  }

  function scrollToBottom(): void {
    const mainElement = document.querySelector("main");

    if (mainElement === null) {
      throw new Error("Could not find main element");
    }

    mainElement.scrollTo(0, mainElement.scrollHeight);
  }
</script>

<svelte:document onkeydown={documentOnKeyDown} />

<div class="centre-contents">
  <div class="page-container">
    {#await pages then pages}
      <img
        src={pages[pageNumber]}
        alt="Page {pageNumber + 1}"
        class="page"
        onload={scrollToBottom} />
    {/await}
  </div>
</div>

<style lang="scss">
  :global(main) {
    position: relative;
  }

  .centre-contents {
    // - 1ch for left margin of page
    width: calc(100% - 1ch);

    display: flex;
    justify-content: center;

    position: absolute;
  }

  .page {
    height: 100vh;
  }
</style>
