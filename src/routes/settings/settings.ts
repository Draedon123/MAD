import { writable, type Writable } from "svelte/store";
import type { Setting } from "./Setting.svelte";

const defaultSettings: Record<string, Setting> = {
  "manga-layout": {
    name: "Manga Layout",
    type: "string",
    description:
      "Decides whether the manga scrolls vertically or flips instantly",
    value: "flip",
    possibleValues: new Set(["flip", "scroll"]),
  },
};

const settings: Writable<Record<string, Setting>> = writable(defaultSettings);

export { defaultSettings, settings };
