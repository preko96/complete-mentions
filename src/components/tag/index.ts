import { ReactElement, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { CommitParam } from '../../utils/createTrackingHandler';
import MentionInputContext from '../../context/mentionInputContext';
import useTrackingHandler from '../../hooks/useTrackingHandler';
import { Platform } from 'react-native';
import { Mention, RenderMention } from '../../utils/createMentionsHandler';

export type Commit = (params: Omit<CommitParam, 'text' | 'formatText'>) => void;
type RenderProps = {
  tracking: boolean;
  keyword: string;
  commit: Commit;
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
  } = props;

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
  }, []);

  useEffect(() => {
    trackingHandler.on('commit', result => {
      const { text, start, keyword, slicedText, id, name } = result;
      const extractedName = formatText ? formatText(name) : name;

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
    });
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
