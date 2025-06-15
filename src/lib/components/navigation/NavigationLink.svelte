<script lang="ts">
  import { page } from "$app/state";

  type Props = {
    href: string;
  } & WithChildren;

  const { href, children }: Props = $props();
</script>

<div class="container">
  <a class="link" class:active={page.url.pathname === href} {href}>
    <span class="indent">{@render children?.()}</span>
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
    font-size: 1.3rem;

    display: block;
    width: 100%;
    padding: 0.2rem 0;

    &:hover {
      color: colours.$text-primary;
    }
  }

  .indent {
    $indent: 1ch;

    display: block;
    width: calc(100% - $indent);
    margin-left: $indent;
  }

  a.active {
    background-color: colours.$primary;
    color: colours.$text-tertiary;

    &:hover {
      color: colours.$text-tertiary;
    }
  }
</style>
