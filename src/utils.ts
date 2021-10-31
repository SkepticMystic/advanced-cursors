import type { App } from "obsidian";
import { DECIMALS, MODES } from "src/const";
import type { Mode, Query } from "src/interfaces";

export const cmdId = (q: Query, mode: Mode) =>
  `AC-${mode}: ${q.name} -> ${q.query}`;
export const cmdName = (q: Query, mode: Mode) => `${mode}: ${displayQ(q)}`;

export const removeQCmds = (app: App, q: Query) => {
  MODES.forEach((mode) => {
    app.commands.removeCommand("advanced-cursors:" + cmdId(q, mode));
  });
};

export const createRegex = (q: Query) => {
  if (q.regexQ) {
    let useFlags = q.flags.slice();
    if (!useFlags.includes("g")) {
      useFlags += "g";
    }
    return new RegExp(q.query, useFlags);
  } else {
    return new RegExp(q.query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "g");
  }
};

export const displayRegex = (q: Query) => {
  let { source, flags } = createRegex(q);
  flags = flags.replace("g", "");
  return `/${source}/${flags}`;
};

export const displayQ = (q: Query) => {
  return `${q.name} → ${displayRegex(q)}`;
};

export function roundNumber(num: number, dec: number = DECIMALS): number {
  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}
