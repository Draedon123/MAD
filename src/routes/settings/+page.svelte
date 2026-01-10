<script lang="ts">
  import * as path from "@tauri-apps/api/path";
  import Setting, { type Setting as SettingsType } from "./Setting.svelte";
  import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
  import { settings as defaultSettings } from "./settings";
  import { onMount } from "svelte";

  const settingsPath = "settings.json";
  let settings: Record<string, SettingsType> | null = $state(null);

  async function getSettings(): Promise<Record<string, SettingsType>> {
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

    const parsedSettings: Record<string, SettingsType> =
      structuredClone(defaultSettings);

    for (const [key, setting] of Object.entries(savedSettings)) {
      if (!(key in defaultSettings)) {
        continue;
      }

      parsedSettings[key].value = setting.value;
    }

    return parsedSettings;
  }

  async function saveSettings(
    settings: Record<string, SettingsType>
  ): Promise<void> {
    const stringified = JSON.stringify(settings);
    await writeTextFile(settingsPath, stringified, {
      baseDir: path.BaseDirectory.AppConfig,
    });
  }

  onMount(async () => {
    settings = await getSettings();
  });
</script>

<main>
  <h1>Settings</h1>
  {#if settings === null}
    Loading settings...
  {:else}
    {#each Object.entries(settings) as [key, setting] (setting)}
      <Setting bind:setting={settings[key]} />
    {/each}

    <br />

    <button
      onclick={() => {
        saveSettings(settings as Record<string, SettingsType>);
      }}>Save</button>
  {/if}
</main>

<style lang="scss">
  @use "/src/styles/button.scss";

  button {
    @include button.button;
  }
</style>
