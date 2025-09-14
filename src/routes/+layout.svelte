<script lang="ts">
  import "../styles/global.scss";
  import Navigation from "$lib/components/navigation/Navigation.svelte";
  import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";
  import { Manga } from "$lib/Manga";
  import NavigationSection from "$lib/components/navigation/NavigationSection.svelte";
  import {
    BaseDirectory,
    watchImmediate,
    type UnwatchFn,
  } from "@tauri-apps/plugin-fs";
  import { appDataDir } from "@tauri-apps/api/path";
  import { onDestroy, onMount } from "svelte";
  import { checkAndMkdir } from "$lib/fsUtils";

  let { children }: WithChildren = $props();
  let manga: Promise<Manga[]> = $state(Manga.getAllInDirectory());
  let unwatch: UnwatchFn | null = null;

  onMount(async () => {
    await checkAndMkdir(await appDataDir());
    await checkAndMkdir("manga", BaseDirectory.AppData);

    unwatch = await watchImmediate(
      "manga",
      (event) => {
        if (!event.paths.some((path) => path.endsWith(".mga"))) {
          return;
        }
        manga = Manga.getAllInDirectory();
      },
      { baseDir: BaseDirectory.AppData }
    );
  });

  onDestroy(() => {
    if (unwatch !== null) {
      unwatch();
    }
  });
</script>

<div class="container">
  <Navigation>
    <NavigationLink href="/">Home</NavigationLink>
    <NavigationLink href="/download">Download</NavigationLink>
    <NavigationSection>
      {#snippet header()}
        <NavigationLink href="/read">Read</NavigationLink>
      {/snippet}
      {#await manga}
        <span class="loading-text">Loading manga...</span>
      {:then mangaList}
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
  @use "/src/styles/colours.scss";

  .container {
    display: grid;
    grid-template-columns: max-content 1fr;
    column-gap: 1ch;
    width: 100vw;
  }

  .loading-text {
    color: colours.$text-tertiary;
    font-size: 1.3rem;
    padding: 0.2rem 0;
  }
</style>
