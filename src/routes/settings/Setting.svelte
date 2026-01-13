<script lang="ts" module>
  type Setting = {
    name: string;
    description: string;
  } & (StringSetting | BooleanSetting);

  type StringSetting = {
    type: "string";
    value: string;
    possibleValues?: Set<string>;
  };

  type BooleanSetting = {
    type: "boolean";
    value: boolean;
  };

  export type { Setting };
</script>

<script lang="ts">
  type Props = {
    setting: Setting;
  };

  let { setting = $bindable() }: Props = $props();

  const inputName = `Setting ${setting.name}`;
</script>

{#if setting.type === "string"}
  <label title={setting.description}>
    {setting.name}:

    {#if setting.possibleValues}
      <!-- seems like the binding is reactive for some reason... -->
      <select name={inputName} bind:value={setting.value}>
        {#each setting.possibleValues as value (value)}
          <option {value}>{value}</option>
        {/each}
      </select>
    {:else}
      <input name={inputName} type="text" bind:value={setting.value} />
    {/if}
  </label>
{:else if setting.type === "boolean"}
  <label title={setting.description}>
    {setting.name}:

    <input type="checkbox" bind:checked={setting.value} />
  </label>
{/if}

<style lang="scss">
  @use "/src/styles/colours.scss";

  input[type="text"] {
    background-color: #373737;
    border-color: #474747;
    border-style: unset;
    color: colours.$text-primary;
    border-radius: 1em;

    height: 1.5em;
    padding: 0 1ch;
    margin-left: 0.5ch;
  }

  label {
    display: block;
  }
</style>
