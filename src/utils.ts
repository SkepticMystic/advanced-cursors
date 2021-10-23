import type { Query } from "src/interfaces";

export const cmdRunId = (q: Query) => `AC-Run: ${q.name} -> ${q.query}`;
export const cmdRunName = (q: Query) => `Run: ${q.name} → ${q.query}`;

export const cmdNextId = (q: Query) => `AC-Next: ${q.name} -> ${q.query}`;
export const cmdNextName = (q: Query) => `Next: ${q.name} → ${q.query}`;

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
