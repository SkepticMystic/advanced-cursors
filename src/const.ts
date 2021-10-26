import type { ACSettings as ACSettings } from "src/interfaces";

export const DEFAULT_SETTINGS: ACSettings = {
  savedQueries: [],
  savedQViewState: { side: "right" },
  lastQ: { name: "", query: "", flags: "", regexQ: true },
};

export const VIEW_TYPE_AC = "Saved Queries View";
