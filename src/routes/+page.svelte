<script lang="ts">
  import { Window } from "@tauri-apps/api/window";
  import { onMount } from "svelte";

  onMount(() => {
    Window.getCurrent().setTitle("MAD | Home");
  });
</script>

<main>
  <h1>Home</h1>
</main>
