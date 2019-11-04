import { useRef } from "react";
import createTrackingHandler, {TrackingParams} from "../utils/createTrackingHandler";

export default function useTrackingHandler(params: TrackingParams) {
    const trackingHandlerRef = useRef(createTrackingHandler(params));
    return trackingHandlerRef.current;
}
