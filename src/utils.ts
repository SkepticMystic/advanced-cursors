import type { Query } from "src/interfaces";

export const cmdRunId = (q: Query) => `AC-Run: ${q.name} -> ${q.query}`;
export const cmdRunName = (q: Query) => `Run: ${q.name} → ${q.query}`;

export const cmdNextId = (q: Query) => `AC-Next: ${q.name} -> ${q.query}`;
export const cmdNextName = (q: Query) => `Next: ${q.name} → ${q.query}`;
