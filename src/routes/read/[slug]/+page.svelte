<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Manga Viewer | Reading {data.mangaName}</title>
</svelte:head>

<main>
  <h1>Reading {data.mangaName}</h1>
</main>
