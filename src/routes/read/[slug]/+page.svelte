<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<main>
  <h1>Reading {data.mangaName}</h1>
</main>
