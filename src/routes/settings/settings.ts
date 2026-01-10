import type { Setting } from "./Setting.svelte";

const settings: Record<string, Setting> = {
  "manga-layout": {
    name: "Manga Layout",
    type: "string",
    description:
      "Decides whether the manga scrolls vertically or flips instantly",
    value: "flip",
    possibleValues: new Set(["flip", "scroll"]),
  },
};
export { settings };
