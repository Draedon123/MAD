<script lang="ts">
  import { page } from "$app/state";

  type Props = {
    href: string;
  } & WithChildren;

  const { href, children }: Props = $props();
</script>

<div class="container">
  <a class="link" class:active={page.url.pathname === href} {href}>
    {@render children?.()}
  </a>
</div>

<style lang="scss">
  .container {
    padding-top: 5px;
    width: 100%;
  }

  .link {
    color: #b0b0b0;
    text-decoration: none;
    border-radius: 0.5rem;
    text-indent: 0.5ch;
    font-size: 1.3rem;

    display: block;
    width: 100%;
    padding: 0.2rem 0;

    &:hover {
      color: white;
    }
  }

  a.active {
    background-color: #cacaf8;
    color: #4f3453;

    &:hover {
      color: #4f3453;
    }
  }
</style>
