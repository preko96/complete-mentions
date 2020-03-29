import { ReactElement, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { CommitParam, Commitment } from '../../utils/createTrackingHandler';
import MentionInputContext from '../../context/mentionInputContext';
import useTrackingHandler from '../../hooks/useTrackingHandler';
import { Mention, RenderMention } from '../../utils/createMentionsHandler';

export type Commit = (params: Omit<CommitParam, 'text' | 'formatText'>) => void;

export type DetectedMention = {
  keyword: string;
  name: string;
  id: string;
  position: number;
};

type RenderProps = {
  tracking: boolean;
  keyword: string;
  commit: Commit;
};

type MentionRegexpMatch = {
  index: number;
  groups: {
    data: string;
    id: string;
    name: string;
  };
};

type TagProps = {
  tag: string;
  renderText: RenderMention;
  extractString: (mention: Mention) => string;
  renderSuggestions?: (params: RenderProps) => ReactNode;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  onKeywordChange?: (keyword: string) => void;
  formatText?: (text: string) => string;
  extractCommit?: (commit: Commit) => void;
  detectMentionsRegexp?: RegExp;
};

export default function Tag(props: TagProps): ReactElement | null {
  const {
    renderSuggestions,
    renderText,
    tag,
    onStartTracking,
    onStopTracking,
    onKeywordChange,
    extractString,
    formatText,
    extractCommit,
    detectMentionsRegexp,
  } = props;

  const addMention = (result: Commitment) => {
    const { text, start, keyword, slicedText, id, name } = result;
    const extractedName = formatText ? formatText(name) : name;
    console.log('commit', text, start, keyword, slicedText, id, name, extractedName);

    if (Platform.OS === 'android') {
      syncHandler.updateSelection({
        start: start,
        end: start + keyword.length,
      });
      syncHandler.updateText(slicedText);
      syncHandler.updateSelection({ start: start, end: start });

      syncHandler.updateText(text);

      // TODO: check if FB fixed this...
      // inputRef.current.setNativeProps({
      //   selection: { start: start + extractedName.length, end: start + extractedName.length },
      // });

      syncHandler.updateSelection({
        start: start + keyword.length,
        end: start + keyword.length,
      });
    } else {
      syncHandler.updateSelection({
        start: start,
        end: start + keyword.length,
      });
      syncHandler.updateSelection({ start: start, end: start });
      syncHandler.updateText(slicedText);
      syncHandler.updateSelection({
        start: start + extractedName.length,
        end: start + extractedName.length,
      });
      syncHandler.updateText(text);
    }

    mentionsHandler.addMention({
      start,
      end: start + extractedName.length,
      name: extractedName,
      value: name,
      id,
      tag,
    });

    mentionsHandler.rerender(text);
    mentionsHandler.extract(text);
  };

  const { mentionsHandler, input, inputRef, syncHandler } = useContext(MentionInputContext);

  const [tracking, setTracking] = useState(false);
  const [keyword, setKeyword] = useState('');
  const trackingHandler = useTrackingHandler({ tag });

  useEffect(() => {
    mentionsHandler.addRenderer({
      tag,
      renderer: renderText,
    });
    mentionsHandler.addExtractor({
      tag,
      extractor: extractString,
    });
  });

  useEffect(() => {
    syncHandler.on('sync', (textBuffer, selectionBuffer) => {
      const [text, prevText] = textBuffer;
      const [selection, prevSelection] = selectionBuffer;
      trackingHandler.updateTracker({
        text,
        prevText,
        selection,
        prevSelection,
      });
    });
    if (!detectMentionsRegexp) {
      return;
    }
    syncHandler.on('initialsync', (text: string) => {
      if (!text) {
        return;
      }
      let currentPart = text;
      let currentText = text;
      let startOffset = 0;
      let match: MentionRegexpMatch = (currentPart.match(
        detectMentionsRegexp,
      ) as unknown) as MentionRegexpMatch;
      while (match) {
        if (!match.groups || !match.groups.name || !match.groups.data) {
          console.error('Please supply valid regexp');
          return;
        }
        const position = match.index + startOffset;
        const keyword = match.groups.data;
        const left = currentText.slice(0, position);
        const right = currentText.slice(position + keyword.length + 1);
        const slicedText = left + ' ' + right;
        const extractedName = formatText ? formatText(match.groups.name) : match.groups.name;
        currentText = left + extractedName + ' ' + right;
        const result = {
          ...match.groups,
          keyword,
          slicedText,
          text: currentText,
          start: position,
          end: position + match.groups.name.length,
        };
        addMention(result);
        currentPart = right;
        startOffset = left.length + extractedName.length + 1;
        match = (currentPart.match(detectMentionsRegexp) as unknown) as MentionRegexpMatch;
      }
    });
  }, []);

  useEffect(() => {
    trackingHandler.on('commit', addMention);
  }, []);

  useEffect(() => {
    trackingHandler.on('startTracking', () => {
      onStartTracking && onStartTracking();
      setTracking(true);
    });
    trackingHandler.on('stopTracking', () => {
      onStopTracking && onStopTracking();
      setTracking(false);
    });
    trackingHandler.on('keywordChange', keyword => {
      onKeywordChange && onKeywordChange(keyword);
      setKeyword(keyword);
    });
  }, []);

  const handleCommit = useCallback(
    ({ name, id }: Omit<CommitParam, 'text'>) => {
      trackingHandler.commit({ text: input, name, id, formatText });
    },
    [input, formatText],
  );

  useEffect(() => {
    if (extractCommit) {
      extractCommit(handleCommit);
    }
  }, [handleCommit]);

  if (!renderSuggestions) return null;
  return renderSuggestions({
    commit: handleCommit,
    keyword,
    tracking,
  }) as ReactElement;
}
