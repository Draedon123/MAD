<script lang="ts" module>
  type Setting = {
    key: string;
    name: string;
    description: string;
  } & StringSetting;

  type StringSetting = {
    type: "string";
    value: string;
  };

  export type { Setting };
</script>

<script lang="ts">
  type Props = {
    setting: Setting;
  };

  let { setting = $bindable() }: Props = $props();
</script>

{#if setting.type === "string"}
  <label>
    {setting.name}:
    <input
      name="setting-{setting.key}"
      type="text"
      bind:value={setting.value}
    />
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
</style>
