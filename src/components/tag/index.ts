import { ReactElement, ReactNode, useContext, useEffect, useState } from 'react';
import { CommitParam } from '../../utils/createTrackingHandler';
import MentionInputContext from '../../context/mentionInputContext';
import useTrackingHandler from '../../hooks/useTrackingHandler';
import { Platform } from 'react-native';
import { Mention, RenderMention } from '../../utils/createMentionsHandler';

type RenderProps = {
  tracking: boolean;
  keyword: string;
  commit: (params: Omit<CommitParam, 'text' | 'formatText'>) => void;
};

type TagProps = {
  tag: string;
  renderText: RenderMention;
  renderSuggestions: (params: RenderProps) => ReactNode;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  onKeywordChange?: (keyword: string) => void;
  extractString: (mention: Mention) => string;
  formatText?: (text: string) => string;
};

export default function Tag(props: TagProps): ReactElement {
  const {
    renderSuggestions,
    renderText,
    tag,
    onStartTracking,
    onStopTracking,
    onKeywordChange,
    extractString,
    formatText,
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
        syncHandler.updateSelection({ start: start - 1, end: start - 1 });

        syncHandler.updateText(text);
        syncHandler.updateSelection({
          start: start + extractedName.length,
          end: start + extractedName.length,
        });
      } else {
        syncHandler.updateSelection({
          start: start,
          end: start + keyword.length,
        });
        syncHandler.updateSelection({ start: start - 1, end: start - 1 });
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
      //mentionsHandler
      // on iOS it's behaves strange... also its snaps automatically
      if (Platform.OS === 'android') {
        inputRef.current.setNativeProps({
          selection: { start: result.end, end: result.end },
        });
      }
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

  const handleCommit = ({ name, id }: Omit<CommitParam, 'text'>) => {
    trackingHandler.commit({ text: input, name, id, formatText });
  };

  return <ReactElement>renderSuggestions({
    commit: handleCommit,
    keyword,
    tracking,
  });
}
