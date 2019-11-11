import { useRef } from 'react';
import createMentionsHandler from '../utils/createMentionsHandler';

export default function useMentionsHandler() {
  const mentionsHandlerRef = useRef(createMentionsHandler());
  return mentionsHandlerRef.current;
}
