<script lang="ts">
  import * as path from "@tauri-apps/api/path";
  import Setting, { type Setting as SettingsType } from "./Setting.svelte";
  import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
  import { settings, defaultSettings } from "./settings";
  import { on } from "svelte/events";
  import { onMount } from "svelte";
  import { Window } from "@tauri-apps/api/window";

  const settingsPath = "settings.json";

  async function getSettings(): Promise<void> {
    if (
      !(await exists(settingsPath, { baseDir: path.BaseDirectory.AppConfig }))
    ) {
      await saveSettings(defaultSettings);
    }

    const fileContents = await readTextFile(settingsPath, {
      baseDir: path.BaseDirectory.AppConfig,
    });

    let savedSettings: Record<string, SettingsType>;
    try {
      savedSettings = JSON.parse(fileContents) as Record<string, SettingsType>;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // settings corrupted
      savedSettings = {};
    }

    for (const [key, setting] of Object.entries(savedSettings)) {
      if (!(key in defaultSettings)) {
        continue;
      }

      $settings[key].value = setting.value;
    }
  }

  async function saveSettings(
    settings: Record<string, SettingsType>
  ): Promise<void> {
    const stringified = JSON.stringify(settings);
    await writeTextFile(settingsPath, stringified, {
      baseDir: path.BaseDirectory.AppConfig,
    });
  }

  onMount(() => {
    Window.getCurrent().setTitle("MAD | Settings");
  });
</script>

<main>
  <h1>Settings</h1>
  {#await getSettings()}
    Loading settings...
  {:then}
    {#each Object.entries($settings) as [key, setting] (setting)}
      <Setting bind:setting={$settings[key]} />
    {/each}

    <br />

    <button
      onclick={() => {
        saveSettings($settings);
      }}>Save</button>
  {/await}
</main>

<style lang="scss">
  @use "/src/styles/button.scss";

  button {
    @include button.button;
  }
</style>
