<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import {
  closeGame,
  gameRef,
  sceneRef,
  isPlaying,
  loaded,
  paint,
  setGame,
  snapshotUpdateTime,
} from "../models/game";
import {
  assert,
  isPointInRectangle,
  screen2world,
  Thing,
  vec,
} from "@vaguevoid/sdk";
import { EditorPainter } from "../models/EditorPainter";
import {
  paintSelectionsSystem,
  select,
  selectedThing,
  hover,
  blur,
  flyoutAnchor,
} from "../models/inspect";
import { Ipc, mountPausedGame, initialize, watchGame } from "@vaguevoid/tools";
import { Cleanup } from "../models/cleanup";
import { label, onHide, onShow } from "../models/util";
import PlayButton from "./PlayButton.vue";

const codeWasUpdated = ref(false);

const hovered = ref([] as Thing[]);
const dialogX = ref(0);
const dialogY = ref(0);

const isWindowVisible = ref(true);

const canvas = ref<HTMLCanvasElement | null>(null);

const cleanup = new Cleanup();

onMounted(async () => {
  try {
    await loadGameAndAttachListeners();
  } catch (e) {
    console.error(e);
  }
});

onShow(async () => {
  if (gameRef.value && !gameRef.value.isPaused) {
    gameRef.value.context.time.now = performance.now() - 16;
  }

  cleanup.track(
    "inspectorHotkeys",
    Ipc.registerGlobalHotkeys({ ignore: ["togglePlay"] })
  );
  cleanup.track(
    "watchGame",
    await watchGame(
      (updatedGame) => {
        if (!gameRef.value) {
          console.warn(`Game code was updated but game is not loaded yet`);
          return;
        }

        gameRef.value.systems = [...updatedGame.systems];
        gameRef.value.systems.push(paintSelectionsSystem);

        if (gameRef.value.context.frame === 1) {
          // if game hasn't been started yet, re-run start functions
          gameRef.value.context.frame--;
          gameRef.value.context.time.now = performance.now() - 16;
          toRaw(gameRef.value).step();
        } else {
          // otherwise if we're paused on a frame, paint without changing simulation
          paint();
        }
        codeWasUpdated.value = true;
        t = setTimeout(() => {
          if (isWindowVisible.value) {
            codeWasUpdated.value = false;
          }
        }, 250);
      },
      (logs) => {
        console.error("game error", logs);
      }
    )
  );
});

onHide(() => {
  cleanup.close(["inspectorHotkeys", "watchGame"]);
});

onBeforeUnmount(() => {
  closeGame();
  cleanup.closeAll();
  window.removeEventListener("keydown", windowKeydown);
  window.removeEventListener("focus", windowFocus);
  window.removeEventListener("blur", windowBlur);
});

watch(selectedThing, (thing) => {
  if (thing) {
    paint();
  }
});

const flashPlayButton = ref(false);
watch(isPlaying, (isPlaying, wasPlaying) => {
  if (isPlaying && !wasPlaying) {
    flashPlayButton.value = true;
    setTimeout(() => {
      flashPlayButton.value = false;
    }, 500);
  }
});

let t: Timer;

async function loadGameAndAttachListeners() {
  assert(canvas.value, "Canvas not found in loadGameAndAttachListeners");

  const gameInstance = await mountPausedGame(canvas.value, undefined, {
    initialSceneUrl: ".fiasco/default.scene.json",
    inputOptions: {
      registerOffscreenMouseEvents: false,
    },
  });
  gameRef.value = gameInstance.game;
  cleanup.track("unmountGame", gameInstance.unmount);

  loaded.value = true;
  cleanup.track(
    "snapshot",
    Ipc.listenSnapshot(gameInstance.game, () => {
      gameRef.value = gameInstance.game;
      sceneRef.value = gameInstance.game.context.scene;
      snapshotUpdateTime.value = performance.now();
    })
  );
  initialize();
  cleanup.track(
    "afterFrame",
    gameInstance.game.afterFrame.connect((ctx) => {
      sceneRef.value = ctx.scene;
      hovered.value = [];
    })
  );
  setGame(gameInstance.game);
  gameInstance.game.step();

  gameRef.value.systems.push(paintSelectionsSystem);

  window.addEventListener("blur", windowBlur);
  window.addEventListener("focus", windowFocus);
  window.addEventListener("keydown", windowKeydown);
}

function windowKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && hovered.value.length > 0) {
    hovered.value = [];
  }
}

function windowBlur() {
  isWindowVisible.value = false;
  clearTimeout(t);
}

function windowFocus() {
  isWindowVisible.value = true;
  if (codeWasUpdated.value) {
    t = setTimeout(() => {
      codeWasUpdated.value = false;
    }, 250);
  }
}

function inspectClick(e: MouseEvent) {
  if (isPlaying.value) {
    return;
  }

  assert(gameRef.value);
  assert(canvas.value);

  const painter = gameRef.value.context.painter as EditorPainter;
  const scene = toRaw(gameRef.value).context.scene as Thing;

  const screenTarget = vec(e.offsetX, e.offsetY).mul(
    canvas.value.width / canvas.value.clientWidth
  );

  const target = screen2world(
    screenTarget,
    gameRef.value.context.camera,
    gameRef.value.context.screen
  );

  hovered.value = scene.all((t) => isPointInRectangle(target, t.bounds()));

  for (const thing of painter.things) {
    for (const kid of thing.all()) {
      if (isPointInRectangle(target, kid.bounds())) {
        hovered.value.push(kid);
      }
    }
  }

  if (hovered.value.length === 1) {
    select(toRaw(hovered.value[0]) as Thing);
    flyoutAnchor.value = canvas.value;
  } else {
    hovered.value.reverse();
    dialogX.value = e.offsetX + 16;
    dialogY.value = e.offsetY;
  }

  paint();
}

function selectHoverCandidate(thing: Thing) {
  select(thing);
  flyoutAnchor.value = canvas.value;

  hovered.value = [];
  paint();
}
</script>

<template>
  <div class="game relative" :class="{ loading: !loaded }">
    <div class="loading-dialog" v-if="!loaded">
      <span>Loading...</span>
    </div>
    <PlayButton v-if="flashPlayButton" />

    <canvas
      ref="canvas"
      :class="{ updated: codeWasUpdated }"
      @click="inspectClick"
    />
    <div
      class="selectDialog card"
      v-if="hovered.length > 1"
      :style="{ left: `${dialogX}px`, top: `${dialogY}px` }"
    >
      <div
        v-for="thing in hovered"
        @mouseenter="hover(thing as any)"
        @mouseleave="blur()"
        @click="selectHoverCandidate(thing as any)"
      >
        {{ label(thing as any) }}
      </div>
    </div>
  </div>
</template>

<style scoped>
canvas {
  background-color: transparent;
  width: 100%;
}

canvas.updated {
  box-shadow: 0px 0px 32px 0px rgb(102, 89, 255);
}

.selectDialog {
  position: absolute;
  z-index: 2;
}

.selectDialog div {
  padding: 4px;
  cursor: pointer;
}

.selectDialog div:hover {
  background-color: var(--plue);
  color: white;
}

.loading canvas {
  background-color: white;
}

div.loading-dialog {
  font-size: var(--fontlarge);
  position: absolute;
  left: 0;
  right: 0;
  top: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
