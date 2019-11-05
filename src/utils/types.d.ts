export type Selection = { start: number; end: number };

export type TextState = {
  text: string;
  prevText: string;
  selection: Selection;
  prevSelection: Selection;
};

export type GenericHandler = (state: TextState) => void;
