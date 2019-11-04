import { Context, createContext, RefObject } from "react";
import { TextInput } from "react-native";
import { MentionsHandler } from "../utils/createMentionsHandler";
import { SynchronizeHandler } from "../utils/createSynchronizeHandler";

const MentionInputContext = createContext({
  input: "",
  inputRef: null,
  syncHandler: null,
  mentionsHandler: null,
}) as Context<{
  input: string;
  inputRef: RefObject<TextInput>;
  syncHandler: SynchronizeHandler;
  mentionsHandler: MentionsHandler;
}>;

export default MentionInputContext
