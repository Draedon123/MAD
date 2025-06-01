<script lang="ts">
  import Navigation from "$lib/components/navigation/Navigation.svelte";
  import NavigationLink from "$lib/components/navigation/NavigationLink.svelte";

  let { children }: WithChildren = $props();
</script>

<Navigation>
  <NavigationLink href="/">Home</NavigationLink>
  <NavigationLink href="/settings">Settings</NavigationLink>
</Navigation>

{@render children?.()}
