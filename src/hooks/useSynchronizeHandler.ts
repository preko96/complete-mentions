import { useRef } from 'react';
import createSynchronizeHandler, { SynchronizeParams } from '../utils/createSynchronizeHandler';

export default function useSynchronizeHandler(params: SynchronizeParams) {
  const synchronizeHandlerRef = useRef(createSynchronizeHandler(params));
  return synchronizeHandlerRef.current;
}
