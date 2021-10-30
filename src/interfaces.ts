export interface Query {
  name: string;
  query: string;
  regexQ: boolean;
  flags: string;
}

export interface ACSettings {
  savedQueries: Query[];
  savedQViewSide: "left" | "right";
  lastQ: Query;
}

export type Mode = "All" | "Next" | "Prev";
declare module "obsidian" {
  interface App {
    commands: {
      removeCommand: (id: string) => unknown;
    };
  }

  interface Editor {
    cm: {
      findWordAt: (pos: EditorPosition) => EditorSelection | null;
      state: {
        wordAt: (offset: number) => { fromOffset: number; toOffset: number };
      };
      getDoc: () => Doc;
    };
  }

  interface Doc {
    markText: (
      from: EditorPosition,
      to: EditorPosition,
      options?: { className?: string }
    ) => TextMarker;
    children: LeafChunk[];
  }

  interface LeafChunk {
    lines: Line[];
  }

  interface TextMarker {
    className: string;
    doc: Doc;
    id: number;
    lines: Line[];
    type: string;
    clear: () => void;
  }

  interface Line {
    markedSpans: MarkedSpan[];
    text: string;
    parent: LeafChunk;
  }

  interface MarkedSpan {
    from: number;
    to: number;
    marker: TextMarker;
  }

  interface WorkspaceItem {
    side: "left" | "right";
  }
}
