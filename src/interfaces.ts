export interface SavedQuery {
  name: string;
  query: string;
  regexQ: boolean;
  flags: string;
}

export interface Settings {
  savedQueries: SavedQuery[];
}
