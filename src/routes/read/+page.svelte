<script lang="ts">
  import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";

  const MANGA = ["test1", "test2"];
</script>

<svelte:head>
  <title>Manga Viewer | Browse</title>
</svelte:head>

<main>
  <h1>Read</h1>

  {#each MANGA as manga}
    <NavigationLink href="/read/{manga}">{manga}</NavigationLink>
  {/each}
</main>
