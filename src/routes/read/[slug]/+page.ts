import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  return {
    mangaName: params.slug,
  };
};
