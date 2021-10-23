export interface Query {
  name: string;
  query: string;
  regexQ: boolean;
  flags: string;
}

export interface Settings {
  savedQueries: Query[];
}
