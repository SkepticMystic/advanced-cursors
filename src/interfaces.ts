export interface Query {
  name: string;
  query: string;
  regexQ: boolean;
  flags: string;
}

export interface ACSettings {
  savedQueries: Query[];
  savedQViewState: { side: "left" | "right" };
}
