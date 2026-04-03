import { useState } from "react";

export default function useHistoryState(initialValue) {
  const [past, setPast] = useState([]);
  const [present, setPresentState] = useState(initialValue);
  const [future, setFuture] = useState([]);

  function setPresent(nextValue) {
    setPast((currentPast) => [...currentPast, present]);
    setPresentState(nextValue);
    setFuture([]);
  }

  function reset(nextValue) {
    setPast([]);
    setPresentState(nextValue);
    setFuture([]);
  }

  function undo() {
    if (!past.length) {
      return;
    }

    const previous = past[past.length - 1];
    setPast((currentPast) => currentPast.slice(0, -1));
    setFuture((currentFuture) => [present, ...currentFuture]);
    setPresentState(previous);
  }

  function redo() {
    if (!future.length) {
      return;
    }

    const next = future[0];
    setFuture((currentFuture) => currentFuture.slice(1));
    setPast((currentPast) => [...currentPast, present]);
    setPresentState(next);
  }

  return {
    past,
    present,
    future,
    setPresent,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
