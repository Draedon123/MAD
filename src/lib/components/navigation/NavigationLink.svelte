<script lang="ts">
  type Props = {
    href: string;
  } & WithChildren;

  const { href, children }: Props = $props();
</script>

<div class="container">
  <a class="link" {href}>
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
    font-size: 1.3rem;

    display: block;
    width: 100%;

    &:hover {
      color: white;
    }
  }
</style>
