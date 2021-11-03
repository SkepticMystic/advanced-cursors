import type { ACSettings } from "src/interfaces";

export const DEFAULT_SETTINGS: ACSettings = {
  savedQueries: [],
  savedQViewSide: "right",
  lastQ: { name: "", query: "", flags: "", regexQ: true },
  openViewOnload: true,
};

export const VIEW_TYPE_AC = "Saved Queries View";

export const MODES = ["All", "Next", "Prev"] as const;

export const DECIMALS = 4;
