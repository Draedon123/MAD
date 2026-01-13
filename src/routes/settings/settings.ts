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
  "english-name": {
    name: "Use English Name",
    type: "boolean",
    description: "Prefer the English name over the local name",
    value: false,
  },
};

const settings: Writable<Record<string, Setting>> = writable(defaultSettings);

export { defaultSettings, settings };
