<script lang="ts">
  import "../styles/global.scss";
  import Navigation from "$lib/components/navigation/Navigation.svelte";
  import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";
  import { Manga } from "$lib/Manga";
  import NavigationSection from "$lib/components/navigation/NavigationSection.svelte";

  let { children }: WithChildren = $props();
  const manga = Manga.getAllInDirectory();
</script>

<div class="container">
  <Navigation>
    <NavigationLink href="/">Home</NavigationLink>
    <NavigationLink href="/download">Download</NavigationLink>
    <NavigationSection>
      {#snippet header()}
        <NavigationLink href="/read">Read</NavigationLink>
      {/snippet}
      {#await manga then mangaList}
        {#each mangaList as manga (manga.name)}
          <NavigationLink href="/read/{encodeURIComponent(manga.name)}"
            >{manga.name}</NavigationLink>
        {/each}
      {/await}
    </NavigationSection>
    <NavigationLink href="/settings">Settings</NavigationLink>
  </Navigation>

  {@render children?.()}
</div>

<style lang="scss">
  .container {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1ch;
    width: 100vw;
  }
</style>
