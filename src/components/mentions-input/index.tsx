import React, {
  PropsWithChildren,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState
} from "react";
import useMentionsHandler from "../../hooks/useMentionsHandler";
import useSynchronizeHandler from "../../hooks/useSynchronizeHandler";
import { Text, TextInput, TextInputProps } from "react-native";
import MentionInputContext from "../../context/mentionInputContext";

type MentionInputProps = TextInputProps & {
  onExtractedStringChange?: (text: string) => void;
};

export default function MentionInput(
  props: PropsWithChildren<MentionInputProps>
) {
  const inputRef = useRef<TextInput>() as RefObject<TextInput>;
  const {
    value,
    onChangeText,
    onSelectionChange,
    onExtractedStringChange,
    ...otherProps
  } = props;

  const [formattedText, setFormattedText] = useState<ReactNode>(value);
  const mentionsHandler = useMentionsHandler();
  const syncHandler = useSynchronizeHandler({
    initialText: value,
    initialSelection: { start: 0, end: 0 },
    buffer: 10
  });

  useEffect(() => {
    syncHandler.on("sync", (textBuffer, selectionBuffer) => {
      const [text, prevText] = textBuffer;

      const [selection, prevSelection] = selectionBuffer;
      mentionsHandler.updateMentions({
        text,
        prevText,
        selection,
        prevSelection
      });
    });

    mentionsHandler.on("render", setFormattedText);
    mentionsHandler.on("extract", text => {
      onExtractedStringChange && onExtractedStringChange(text);
    });
  }, []);

  function handleChangeText(text) {
    syncHandler.updateText(text);
    onChangeText && onChangeText(text);
  }

  function handleSelectionChange(event) {
    syncHandler.updateSelection(event.nativeEvent.selection);
    onSelectionChange && onSelectionChange(event);
  }

  return (
    <MentionInputContext.Provider
      value={{ input: value, inputRef, mentionsHandler, syncHandler }}
    >
      {props.children}
      <TextInput
        {...otherProps}
        ref={inputRef}
        multiline
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
      >
        <Text>{formattedText}</Text>
      </TextInput>
    </MentionInputContext.Provider>
  );
}
