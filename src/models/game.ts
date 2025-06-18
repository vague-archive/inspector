import {
  assert,
  InputSource,
  sleep,
  Thing,
  WebGpuPainter,
  Game,
} from "@vaguevoid/sdk";
import { Serialize, Ipc } from "@vaguevoid/tools";
import { ref } from "vue";
import { EditorPainter } from "./EditorPainter";

const jumpTime = 2.5; // seconds

let game: Game<unknown>;

const history = [] as FrameState[];
let startState = null as FrameState | null;
type FrameState = {
  frame: number;
  state: Uint8Array;
  inputs: Uint8Array;
  dt: number;
};

let frameIndex = 0;
let afterFrameListener: (() => void) | null = null;

export const gameRef = ref<Game<unknown> | null>(null);
export const sceneRef = ref(new Thing());
export const frameNumber = ref(0);
export const snapshotUpdateTime = ref(0);
export const loaded = ref(false);
export const isPlaying = ref(false);
export const isFullscreen = ref(false);
export const hasTimetraveled = ref(false);

export const isBig = ref(false);

export function setGame<TState>(g: Game<TState>) {
  game = g as Game<unknown>;

  gameRef.value = game;

  // @ts-ignore
  game.context.painter = new EditorPainter(
    game.context.painter as WebGpuPainter
  );

  if (!isBig.value) {
    const frameState = {
      frame: game.context.frame,
      state: Serialize.dump(game),
      inputs: new Uint8Array(game.context.snapshotBuffer),
      dt: game.context.time.dt,
    };
    startState = frameState;
  }

  afterFrameListener = game.afterFrame.connect(() => {
    if (!isBig.value) {
      const index = history.findIndex((s) => s.frame === game.context.frame);
      const frameState = {
        frame: game.context.frame,
        state: Serialize.dump(game),
        inputs: new Uint8Array(game.context.snapshotBuffer),
        dt: game.context.time.dt,
      };

      if (index == -1) {
        history.push(frameState);
        frameIndex = history.length - 1;
      } else {
        history[index] = frameState;
        frameIndex = index;
      }
    }
    frameNumber.value = game.context.frame;
  });
}

export function useGame(): Game<unknown> {
  if (!game) {
    throw new Error("Game not set");
  }
  return game;
}

export async function useGameAsync(): Promise<Game<unknown>> {
  const start = performance.now();
  while (!game) {
    await sleep(20);
    if (performance.now() - start > 5000) {
      throw new Error("Game failed to load in 5 seconds");
    }
  }
  return game;
}

export function closeGame() {
  afterFrameListener?.();
}

export function play() {
  // fix dt values
  game.context.time.now = performance.now() - 16;
  game.unpause();
  isPlaying.value = true;
}

export function pause() {
  game.pause();
  isPlaying.value = false;
  if (!isBig.value) {
    Ipc.sendSnapshot(game);
  }
}

export function jumpBack() {
  frameIndex = Math.max(frameIndex - jumpTime * 60, 0);

  if (frameIndex === 0) {
    reset();
    // we do need to paint here because we're jumping back to the start, but frame 0 has
    // no visuals, so jumpBack will always jump back to the first visible frame (after frame 0 is processed)
    stepForward();
  } else {
    const frameState = history[frameIndex];
    assert(frameState);
    Serialize.hydrate(game, frameState.state);
    frameNumber.value = game.context.frame;
    game.paint();
    game.receiveInputBuffer(frameState.inputs);
  }
  hasTimetraveled.value = true;
}

function reset() {
  const frameState = startState;
  assert(frameState);
  Serialize.hydrate(game, frameState.state);
  game.resetStart();
  game.context.frame = frameIndex = frameNumber.value = 0;
}

export function stepBack() {
  if (frameIndex === 0) {
    // step back to frame 0 but don't paint
    reset();
  } else {
    const frameState = history[frameIndex - 1];
    frameIndex--;
    Serialize.hydrate(game, frameState.state);
    game.paint();
    game.receiveInputBuffer(frameState.inputs);
    frameNumber.value = game.context.frame;
    // the sdk increments the frame number after running the afterFrame system
    // so we want game.context.frame to represent the next frame to be processed and
    // frameNumber.value to be the frame that was just processed
    // https://github.com/vaguevoid/sdk/blob/main/src/game.ts#L506
    game.context.frame++;
  }

  hasTimetraveled.value = true;

  if (isPlaying.value) {
    pause();
  }
}

export function clearForward() {
  history.splice(frameIndex + 1);
}

export function stepForward() {
  if (history[frameIndex + 1]) {
    const inputBuffer = history[frameIndex + 1].inputs;
    const inputSource = {
      readInput() {
        return inputBuffer;
      },
      pollGamepads() {},
      resize() {},
    } satisfies InputSource;
    const realInputSource = game.inputSource;
    game.inputSource = inputSource;
    game.step(history[frameIndex + 1].dt);
    game.inputSource = realInputSource;
  } else {
    game.step(16);
  }

  if (isPlaying.value) {
    pause();
  }
}

export function jumpForward() {
  const realInputSource = game.inputSource;
  let index = frameIndex;
  const historyInputSource = {
    pollGamepads() {},
    resize() {},
    readInput() {
      return history[index++].inputs;
    },
  } satisfies InputSource;

  try {
    game.inputSource = historyInputSource;
    for (let i = 0; i < jumpTime * 60; i++) {
      if (!history[index]) {
        game.inputSource = realInputSource;
        game.step(undefined, { headless: true });
      } else {
        game.step(history[index].dt, { headless: true });
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    game.inputSource = realInputSource;
  }
  game.paint();
}

export function togglePlay() {
  if (isFullscreen.value) {
    Ipc.toggleFullscreen();
    return;
  }

  if (isPlaying.value) {
    pause();
  } else {
    play();
  }
}

export function reload() {
  window.location.reload();
}

export function paint() {
  game.paint();
}
