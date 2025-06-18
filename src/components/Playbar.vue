<script setup lang="ts">
import IconFullscreen from "./icons/IconFullscreen.vue";
import IconReload from "./icons/IconReload.vue";
import IconJumpBack from "./icons/IconJumpBack.vue";
import IconStepBack from "./icons/IconStepBack.vue";
import IconPlay from "./icons/IconPlay.vue";
import IconPause from "./icons/IconPause.vue";
import IconStepForward from "./icons/IconStepForward.vue";
import IconJumpForward from "./icons/IconJumpForward.vue";
import IconScenarios from "./icons/IconScenarios.vue";
import IconAddScenario from "./icons/IconAddScenario.vue";
import {
  isFullscreen,
  isPlaying,
  jumpBack,
  jumpForward,
  pause,
  play,
  stepBack,
  stepForward,
  togglePlay,
  reload,
  hasTimetraveled,
  useGame,
} from "../models/game";
import { Ipc } from "@vaguevoid/tools";
import { Cleanup } from "../models/cleanup";
import { onHide, onShow } from "../models/util";

const cleanup = new Cleanup();

onShow(() => {
  window.addEventListener("keydown", keydown);
  window.addEventListener("beforeunload", beforeunload);

  cleanup.track(
    "playbar-commandPalette",
    Ipc.registerCommandPaletteShortcuts([
      {
        id: "playbar-jump-back",
        name: "Jump Back",
        description: "Jump back a few seconds",
        shortcut: [";"],
        action() {
          hasTimetraveled.value = true;
          jumpBack();
        },
      },
      {
        id: "playbar-step-back",
        name: "Step Back",
        description: "Step back one frame",
        shortcut: [","],
        action() {
          hasTimetraveled.value = true;
          stepBack();
        },
      },
      {
        id: "playbar-play",
        name: "Play",
        action() {
          play();
        },
      },
      {
        id: "playbar-pause",
        name: "Pause",
        action() {
          pause();
        },
      },
      {
        id: "playbar-step-forward",
        name: "Step Forward",
        description: "Step forward one frame",
        shortcut: ["."],
        action() {
          stepForward();
        },
      },
      {
        id: "playbar-jump-forward",
        name: "Jump Forward",
        description: "Jump forward a few seconds",
        shortcut: ["'"],
        action() {
          jumpForward();
        },
      },
    ])
  );
});

onHide(() => {
  window.removeEventListener("keydown", keydown);
  window.removeEventListener("beforeunload", beforeunload);
  try {
    const game = useGame();
    Ipc.sendSnapshot(game);
  } catch (e) {
    console.warn("tried to send snapshot but couldn't useGame", e);
  }
  cleanup.closeAll();
});

function beforeunload(e: BeforeUnloadEvent) {
  const game = useGame();
  Ipc.sendSnapshot(game);

  // temporarily disabled because electron needs custom logic for beforeunload
  // if (hasTimetraveled.value) {
  //   e.preventDefault();
  // }
}

function keydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();

    if (e.metaKey && e.ctrlKey) {
      stepForward();
    } else {
      togglePlay();
    }
  }

  switch (e.key) {
    case ",":
    case "<":
      hasTimetraveled.value = true;
      stepBack();
      break;
    case ".":
    case ">":
      stepForward();
      break;
    case ";":
    case ":":
      hasTimetraveled.value = true;
      jumpBack();
      break;
    case "'":
    case '"':
      jumpForward();
      break;
  }
}

function addScenario() {
  console.log("add scenario");
}

function showScenarios() {
  console.log("show scenarios");
}

let interval: Timer;

function startStep(n: number) {
  interval = setInterval(() => {
    n > 0 ? stepForward() : stepBack();
  }, 20);
}

function cancelStep() {
  if (interval) {
    clearInterval(interval);
  }
}
</script>

<template>
  <div class="playbar card">
    <section>
      <button
        @click="isFullscreen = !isFullscreen"
        :class="{ on: isFullscreen }"
      >
        <IconFullscreen />
      </button>
      <button @click="reload">
        <IconReload />
      </button>
    </section>

    <section>
      <button @click="jumpBack">
        <IconJumpBack />
        <label class="card">jump back <span class="card">;</span></label>
      </button>
      <button
        @mousedown="startStep(-1)"
        @mouseup="cancelStep()"
        @mouseleave="cancelStep()"
      >
        <IconStepBack />
        <label class="card">step back <span class="card">,</span></label>
      </button>
      <button class="playpause" v-if="!isPlaying" @click="togglePlay">
        <IconPlay />
        <label class="card">play <span class="card">cmd+enter</span></label>
      </button>
      <button class="playpause" v-else @click="togglePlay">
        <IconPause />
        <label class="card">pause <span class="card">cmd+enter</span></label>
      </button>
      <button
        @mousedown="startStep(1)"
        @mouseup="cancelStep()"
        @mouseleave="cancelStep()"
      >
        <IconStepForward />
        <label class="card">step forward <span class="card">.</span></label>
      </button>
      <button @click="jumpForward">
        <IconJumpForward />
        <label class="card">jump forward <span class="card">'</span></label>
      </button>
    </section>
    <section>
      <button @click="addScenario">
        <IconAddScenario />
      </button>
      <button @click="showScenarios">
        <IconScenarios />
      </button>
    </section>
  </div>
</template>

<style scoped>
.playbar {
  display: inline-flex;
  position: relative;
}

section {
  display: flex;
  height: 32px;
  padding: 8px;
  border-right: 1px solid black;
  align-items: center;
}
section:last-child {
  border-right: 0;
}

.divider {
  border-right: 1px solid black;
  padding-right: 8px;
  margin-right: 4px;
}
button {
  border: 0;
  margin-right: 4px;
  width: 16px;
  height: 16px;
  padding: 0;
  background: none;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 32px;
  outline: none;
  color: black;
}
button:last-child {
  margin-right: 0;
}

button:hover {
  color: var(--plue);
}
button.playpause {
  width: 24px;
  height: 24px;
  border-radius: 32px;
  border: 1px solid black;
  box-shadow: 1px 1px 0px 0px #000;
}
button.playpause:hover {
  background-color: var(--plue);
  color: white;
}

button.on {
  color: var(--plue);
}

button label {
  display: none;
  font-weight: normal;
}

button label span {
  font-weight: bold;
  min-width: 16px;
  text-align: center;
  display: inline-block;
}
button:hover label {
  display: block;
  position: absolute;
  color: black;
  background-color: #d2d1db;
  bottom: -24px;
  min-width: 16px;
  padding: 4px;
}
</style>
