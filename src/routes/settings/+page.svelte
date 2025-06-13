<script lang="ts">
  import * as path from "@tauri-apps/api/path";
  import Setting, { type Setting as SettingsType } from "./Setting.svelte";
  import { exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
  import { settingsSchema } from "./settings";
  import { onMount } from "svelte";

  const settingsPath = "settings.json";
  let settings: SettingsType[] | null = $state(null);

  async function getSettings(): Promise<SettingsType[]> {
    if (
      !(await exists(settingsPath, { baseDir: path.BaseDirectory.AppConfig }))
    ) {
      await saveSettings(settingsSchema);
    }

    const fileContents = await readTextFile(settingsPath, {
      baseDir: path.BaseDirectory.AppConfig,
    });

    let savedSettings: [string, string][];
    try {
      savedSettings = JSON.parse(fileContents) as [string, string][];
    } catch (error) {
      // settings corrupted
      savedSettings = settingsSchema.map(({ key, value }) => [key, value]);
    }

    const parsedSettings: SettingsType[] = [];

    for (const [key, value] of savedSettings) {
      const _setting = settingsSchema.find((setting) => setting.key === key);

      if (_setting === undefined) {
        continue;
      }

      const setting = structuredClone(_setting);

      setting.value = value;

      parsedSettings.push(setting);
    }

    return parsedSettings;
  }

  async function saveSettings(settings: SettingsType[]): Promise<void> {
    const minimalSettingsObject: [string, string][] = settings.map(
      ({ key, value }) => [key, value]
    );

    const stringified = JSON.stringify(minimalSettingsObject);
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
    {#each settings as setting, i (setting)}
      <Setting bind:setting={settings[i]} />
    {/each}

    <br />

    <button
      onclick={() => {
        // @ts-expect-error in this branch of the if statement,
        // settings cannot be null
        saveSettings(settings);
      }}>Save</button
    >
  {/if}
</main>
