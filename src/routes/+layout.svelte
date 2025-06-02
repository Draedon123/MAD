<script lang="ts">
  import "../styles/global.scss";
  import Navigation from "$lib/components/navigation/Navigation.svelte";
  import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";

  let { children }: WithChildren = $props();
</script>

<Navigation>
  <NavigationLink href="/">Home</NavigationLink>
  <NavigationLink href="/download">Download</NavigationLink>
  <NavigationLink href="/read">Read</NavigationLink>
  <NavigationLink href="/settings">Settings</NavigationLink>
</Navigation>

{@render children?.()}
