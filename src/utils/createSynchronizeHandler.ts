import { Platform } from 'react-native';
import { Selection } from './types';

export type SynchronizeHandler = {
  on: SynchronizeEvents;
  updateText: UpdateText;
  updateSelection: UpdateSelection;
};

export type SynchronizeParams = {
  initialText: string;
  initialSelection: Selection;
  buffer: number;
};

type SyncSub = (textBuffer: string[], selectionBuffer: Selection[]) => void;
type InitialSyncSub = (text: string) => void;
type SynchronizeEvents = {
  (type: 'sync', sub: SyncSub): void;
  (type: 'initialsync', sub: InitialSyncSub): void;
};

type UpdateSelection = (selection: Selection) => void;
type UpdateText = (text: string) => void;

export default function createSynchronizeHandler(params: SynchronizeParams): SynchronizeHandler {
  const { buffer, initialSelection, initialText } = params;
  let selectionBuffer: Selection[] = [initialSelection];
  let textBuffer: string[] = [initialText];
  let queue: string[] = [];
  const syncSubs: SyncSub[] = [];

  const updateSelection: UpdateSelection = selection => {
    const [last] = selectionBuffer;
    if (last.start === selection.start && last.end === selection.end) return;

    selectionBuffer = [selection, ...selectionBuffer].slice(0, buffer);
    queue = ['selection', ...queue].slice(0, 10);
    check();
  };
  const updateText: UpdateText = text => {
    textBuffer = [text, ...textBuffer].slice(0, buffer);
    queue = ['text', ...queue].slice(0, 10);
    check();
  };

  const check = () => {
    const [first, last] = queue;
    const sync =
      Platform.OS === 'android'
        ? first === 'selection' && last === 'text'
        : first === 'text' && last === 'selection';

    if (sync) {
      syncSubs.forEach(sub => {
        sub(textBuffer, selectionBuffer);
      });
    }
  };

  const on: SynchronizeEvents = (type: 'sync' | 'initialsync', sub) => {
    if (type === 'sync') {
      syncSubs.push(sub);
    } else if (type == 'initialsync') {
      // As this is called on creating the components, need to wait for them to register everything
      setTimeout(() => sub(textBuffer[0]));
    }
  };

  return { on, updateText, updateSelection };
}
