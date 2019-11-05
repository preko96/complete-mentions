import { ReactNode } from 'react';
import { GenericHandler } from './types';

type RenderSub = (nodes: ReactNode[]) => void;
type ExtractorSub = (extractedStr: string) => void;
type MentionEvents = {
  (type: 'render', sub: RenderSub): void;
  (type: 'extract', sub: ExtractorSub): void;
};
export type MentionsHandler = {
  updateMentions: GenericHandler;
  addMention: AddMention;
  on: MentionEvents;
  rerender: Render;
  extract: Extract;
  addRenderer: AddRenderer;
  addExtractor: AddExtractor;
};

export type RenderMention = (mention: Mention) => ReactNode;

export type Mention = {
  uniqueId: number;
  tag: string;
  id: string;
  value: string;
  name: string;
  start: number;
  end: number;
};

type Renderer = {
  tag: string;
  renderer: (mention: Mention) => ReactNode;
};

type Extractor = {
  tag: string;
  extractor: (mention: Mention) => string;
};

type AddRenderer = (renderer: Renderer) => void;
type AddExtractor = (extractor: Extractor) => void;
type AddMention = (mention: Omit<Mention, 'uniqueId'>) => void;
type Render = (text: string) => void;
type Extract = (text: string) => void;

export default function createMentionsHandler() {
  const renderers: { [K: string]: Renderer['renderer'] } = {};
  const extractors: { [K: string]: Extractor['extractor'] } = {};

  let uniqueId = 0;
  let mentions: Mention[] = [];
  const renderSubs: RenderSub[] = [];
  const extractorSubs: ExtractorSub[] = [];

  const on: MentionEvents = (type: any, sub: any) => {
    if (type === 'render') renderSubs.push(sub);
    else if (type === 'extract') extractorSubs.push(sub);
  };

  const addRenderer: AddRenderer = ({ tag, renderer }) => {
    renderers[tag] = renderer;
  };

  const addExtractor: AddExtractor = ({ tag, extractor }) => {
    extractors[tag] = extractor;
  };

  const addMention: AddMention = mention => {
    mentions.push({ ...mention, uniqueId: uniqueId++ });
    mentions = mentions.sort((left, right) => left.start - right.start);
  };

  const handleRemove: GenericHandler = ({ text, prevText, selection, prevSelection }) => {
    // TODO: RETURN REMOVED ELEMENTS SO WE CAN HANDLE MOVING MORE ELEGANTLY
    const ranged = prevSelection.start !== prevSelection.end;
    const batch = Math.abs(selection.start - prevSelection.start) > 1;
    /*
          1 => ranged (both remove or mod)
          2 => removed single char
          3 => added new char in-between mention
        */
    if (ranged || batch) {
      mentions = mentions.filter(mention => {
        const intersectStart =
          prevSelection.start < mention.start && prevSelection.end > mention.start;

        const intersectEnd = prevSelection.start < mention.end && prevSelection.end > mention.end;

        const intersectBetween =
          prevSelection.start >= mention.start && prevSelection.end <= mention.end;

        if (ranged) {
          return !(intersectStart || intersectEnd || intersectBetween);
        }

        const batchedSelection = {
          start: Math.min(selection.start, prevSelection.start),
          end: Math.max(selection.end, prevSelection.start),
        };

        const batchIntersectEnd =
          batchedSelection.start <= mention.end && batchedSelection.end >= mention.end;

        const batchIntersectBetween =
          batchedSelection.start >= mention.start && batchedSelection.end <= mention.end;

        return !(batchIntersectEnd || batchIntersectBetween);
      });
    } else if (text.length < prevText.length) {
      mentions = mentions.filter(mention => {
        const intersects = prevSelection.start > mention.start && prevSelection.end <= mention.end;
        return !intersects;
      });
    } else {
      mentions = mentions.filter(mention => {
        const intersects = prevSelection.start > mention.start && prevSelection.end < mention.end;
        return !intersects;
      });
    }
  };

  const handleMove: GenericHandler = ({ text, prevText, prevSelection }) => {
    const diff = text.length - prevText.length;
    mentions = mentions.map(mention => {
      const after = prevSelection.start <= mention.start;
      if (after) {
        return {
          ...mention,
          start: mention.start + diff,
          end: mention.end + diff,
        };
      } else {
        return mention;
      }
    });
  };

  const updateMentions: GenericHandler = state => {
    handleRemove(state);
    handleMove(state);
    rerender(state.text);
    extract(state.text);
  };

  const rerender: Render = text => {
    let prevEnd = 0;
    const parts: ReactNode[] = [];
    if (mentions.length === 0) {
      parts.push(text);
    } else {
      mentions.forEach((mention, index) => {
        const last = index === mentions.length - 1;
        const { start, end } = mention;
        const left = text.slice(prevEnd, start);
        prevEnd = end;

        const renderer = renderers[mention.tag];

        parts.push(left);
        parts.push(renderer(mention));
        if (last) {
          const right = text.slice(end);
          parts.push(right);
        }
      });
    }
    renderSubs.forEach(sub => {
      sub(parts);
    });
  };

  const extract: Render = text => {
    let prevEnd = 0;
    let result = '';
    if (mentions.length === 0) {
      result += text;
    } else {
      mentions.forEach((mention, index) => {
        const last = index === mentions.length - 1;
        const { start, end } = mention;
        const left = text.slice(prevEnd, start);
        prevEnd = end;

        const extractor = extractors[mention.tag];
        result += left;
        result += extractor(mention);
        if (last) {
          const right = text.slice(end);
          result += right;
        }
      });
    }
    extractorSubs.forEach(sub => {
      sub(result);
    });
  };

  return {
    updateMentions,
    addMention,
    on,
    rerender,
    extract,
    addRenderer,
    addExtractor,
  };
}
