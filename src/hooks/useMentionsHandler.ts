import createMentionsHandler from "../utils/createMentionsHandler";
import {useRef} from "react";

export default function useMentionsHandler() {
    const mentionsHandlerRef = useRef(createMentionsHandler());
    return mentionsHandlerRef.current
}
