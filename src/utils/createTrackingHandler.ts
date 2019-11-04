import { GenericHandler } from "./types";

export type TrackingParams = { tag: string; }
type CommitSub = (commitResult?: Commitment) => void;
type KeywordChangeSub = (keyword: string) => void;
type TrackingEvents = {
  (type: "commit", sub: CommitSub): void;
  (type: "startTracking", sub: Function): void;
  (type: "stopTracking", sub: Function): void;
  (type: "keywordChange", sub: KeywordChangeSub): void;
};

type TrackingHandler = {
  updateTracker: GenericHandler;
  on: TrackingEvents;
  commit: (params: CommitParam) => void;
};

export type CommitParam = {
  text: string;
  name: string;
  id: string;
  formatText: (text: string) => string;
};

export type Commitment = {
  keyword: string;
  slicedText: string;
  name: string;
  id: string;
  text: string;
  start: number;
  end: number;
};

export default function createTrackingHandler(params: TrackingParams): TrackingHandler {
  let trackingQueue: boolean[] = [false];
  let position: number = -1;
  let keyword: string = "";

  const commitSubs: CommitSub[] = [];
  const startTrackingSubs: Function[] = [];
  const stopTrackingSubs: Function[] = [];
  const keywordChangeSubs: KeywordChangeSub[] = [];

  const stopTracking = () => {
    position = -1;
    keyword = "";
    trackingQueue = [false, ...trackingQueue];
  };

  const preHandleTrackingState: GenericHandler = ({
    text,
    selection,
    prevSelection
  }) => {
    const lastChar = text[selection.start - 1];
    const ranged = prevSelection.start !== prevSelection.end;
    const [tracking] = trackingQueue;
    if (!tracking) {
      if (lastChar === params.tag) {
        position = selection.start - 1;
        trackingQueue = [true, ...trackingQueue];
      }
    } else {
      if (ranged) stopTracking();
      else if (lastChar === " ") stopTracking();
      else if (selection.start - 1 < position) stopTracking();
    }

    if (tracking === trackingQueue[0])
      trackingQueue = [tracking, ...trackingQueue];
  };

  const postHandleTrackingState: GenericHandler = ({ selection }) => {
    const [tracking] = trackingQueue;
    if (tracking) {
      if (selection.start - 1 > position + keyword.length) stopTracking();
    }
  };

  const updateKeyword: GenericHandler = ({ text }) => {
    if (position !== -1) {
      keyword = /([^\s]+)/.exec(text.substr(position))[0];
      keywordChangeSubs.forEach(sub => {
        sub(keyword.split(params.tag)[1])
      })
    }
  };

  const updateTracker: GenericHandler = params => {
    preHandleTrackingState(params);
    updateKeyword(params);
    postHandleTrackingState(params);
    check();
  };

  const on: TrackingEvents = (type, sub) => {
    if (type === "commit") {
      commitSubs.push(sub);
    } else if (type === "startTracking") {
      startTrackingSubs.push(sub);
    } else if (type === "stopTracking") {
      stopTrackingSubs.push(sub);
    } else if (type === 'keywordChange') {
      keywordChangeSubs.push(sub)
    }
  };

  const check = () => {
    trackingQueue = trackingQueue.slice(0, 10);
    const [currentTracking, prevTracking] = trackingQueue;
    if (!prevTracking && currentTracking) {
      startTrackingSubs.forEach(sub => {
        sub();
      });
    } else if (prevTracking && !currentTracking) {
      stopTrackingSubs.forEach(sub => {
        sub();
      });
    }
  };

  const commit = ({ text, name, id, formatText }) => {
    const left = text.slice(0, position);
    const right = text.slice(position + keyword.length + 1);
    const slicedText = left + " " + right;
    const extractedName = formatText ? formatText(name) : name;
    const full = left + extractedName + " " + right;
    const result = {
      keyword,
      slicedText,
      name,
      id,
      text: full,
      start: position,
      end: position + name.length
    };

    check();
    stopTracking();
    check();

    commitSubs.forEach(sub => {
      sub(result);
    });

    return result;
  };

  return { updateTracker, on, commit };
}
