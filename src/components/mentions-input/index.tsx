import React, {
  MutableRefObject,
  PropsWithChildren,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import useMentionsHandler from '../../hooks/useMentionsHandler';
import useSynchronizeHandler from '../../hooks/useSynchronizeHandler';
import {
  NativeSyntheticEvent,
  Text,
  TextInput,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native';
import MentionInputContext from '../../context/mentionInputContext';
import { Selection } from '../../utils/types';

type MentionInputProps = TextInputProps & {
  value: string;
  inputRef?: MutableRefObject<TextInput>;
  onExtractedStringChange?: (text: string) => void;
};

export default function MentionInput(props: PropsWithChildren<MentionInputProps>) {
  const inputRef = useRef<TextInput>() as MutableRefObject<TextInput>;
  const {
    value,
    onChangeText,
    onSelectionChange,
    onExtractedStringChange,
    inputRef: propInputRef,
    ...otherProps
  } = props;

  const [formattedText, setFormattedText] = useState<ReactNode>(value);
  const mentionsHandler = useMentionsHandler();
  const syncHandler = useSynchronizeHandler({
    initialText: value,
    initialSelection: { start: 0, end: 0 },
    buffer: 10,
  });

  useEffect(() => {
    syncHandler.on('sync', (textBuffer, selectionBuffer) => {
      const [text, prevText] = textBuffer;

      const [selection, prevSelection] = selectionBuffer;
      mentionsHandler.updateMentions({
        text,
        prevText,
        selection,
        prevSelection,
      });
    });

    mentionsHandler.on('render', setFormattedText);
    mentionsHandler.on('extract', text => {
      onExtractedStringChange && onExtractedStringChange(text);
    });
  }, []);

  function handleChangeText(text: string) {
    syncHandler.updateText(text);
    onChangeText && onChangeText(text);
  }

  function handleSelectionChange(event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    syncHandler.updateSelection(event.nativeEvent.selection);
    onSelectionChange && onSelectionChange(event);
  }

  function handleInputRef(ref: TextInput) {
    if (inputRef.current) inputRef.current = ref as TextInput;
    if (propInputRef) propInputRef.current = ref as TextInput;
  }

  return (
    <MentionInputContext.Provider value={{ input: value, inputRef, mentionsHandler, syncHandler }}>
      {props.children}
      <TextInput
        {...otherProps}
        ref={handleInputRef}
        multiline
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}>
        <Text>{formattedText}</Text>
      </TextInput>
    </MentionInputContext.Provider>
  );
}
