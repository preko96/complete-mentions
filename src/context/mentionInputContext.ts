import { Context, createContext, MutableRefObject } from 'react';
import { TextInput } from 'react-native';
import { MentionsHandler } from '../utils/createMentionsHandler';
import { SynchronizeHandler } from '../utils/createSynchronizeHandler';

const MentionInputContext = (createContext({
  input: '',
  inputRef: null,
  syncHandler: null,
  mentionsHandler: null,
}) as unknown) as Context<{
  input: string;
  inputRef: MutableRefObject<TextInput>;
  syncHandler: SynchronizeHandler;
  mentionsHandler: MentionsHandler;
}>;

export default MentionInputContext;
