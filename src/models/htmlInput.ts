import { useGame } from "./game";
import { Ipc } from "@vaguevoid/tools";

export function selectOnFocus(e: Event) {
  (e.target as HTMLInputElement).select();
}

export function shouldPropagate(e: KeyboardEvent) {
  return Ipc.isGlobalHotkey(e);
}

export function swallowKey(e: KeyboardEvent) {
  if (!shouldPropagate(e)) {
    e.stopPropagation();
  }
}

export function stopScroll(e: KeyboardEvent) {
  const game = useGame();
  if (
    !game.isPaused &&
    ["ArrowDown", "ArrowRight", "ArrowLeft", "ArrowUp"].includes(e.key)
  ) {
    e.preventDefault();
  }
}
