<script lang="ts">
  import { page } from "$app/state";

  type Props = {
    href: string;
    level?: number;
  } & WithChildren;

  const { href, level = 1, children }: Props = $props();
</script>

<div class="container">
  <a
    class="link level-{level}"
    class:active={page.url.pathname === href}
    {href}
  >
    {@render children?.()}
  </a>
</div>

<style lang="scss">
  @use "/src/styles/colours.scss";

  .container {
    padding: 2.5px 0;
    width: 100%;
  }

  .link {
    color: colours.$text-secondary;
    text-decoration: none;
    border-radius: 0.5rem;
    text-indent: 0.5ch;
    font-size: 1.3rem;

    display: block;
    width: 100%;
    padding: 0.2rem 0;

    &:hover {
      color: colours.$text-primary;
    }
  }

  .level-2 {
    text-indent: 1.5ch;
  }

  a.active {
    background-color: colours.$primary;
    color: colours.$text-tertiary;

    &:hover {
      color: colours.$text-tertiary;
    }
  }
</style>
