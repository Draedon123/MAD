<script lang="ts">
  import "../styles/global.scss";
  import Navigation from "$lib/components/navigation/Navigation.svelte";
  import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";

  let { children }: WithChildren = $props();
</script>

<div class="container">
  <Navigation>
    <NavigationLink href="/">Home</NavigationLink>
    <NavigationLink href="/download">Download</NavigationLink>
    <NavigationLink href="/read">Read</NavigationLink>
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
