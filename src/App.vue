<script setup lang="ts">
import { ref } from "vue";
import Playbar from "./components/Playbar.vue";
import Inspect from "./components/Inspect.vue";
import Console from "./components/Console.vue";
import Hierarchy from "./components/Hierarchy.vue";
import { captureLogs, releaseLogs } from "./models/console";
import { loaded, gameRef, sceneRef, useGame } from "./models/game";
import GameComponent from "./components/Game.vue";
import { assert, Game, Thing } from "@vaguevoid/sdk";
import Flyout from "./components/Flyout.vue";
import { Fs } from "@vaguevoid/tools";
import { Cleanup } from "./models/cleanup";
import { onHide, onShow } from "./models/util";

const hasSceneUpdate = ref(false);
const cleanup = new Cleanup();

onShow(async () => {
  window.focus();
  captureLogs();
  window.addEventListener("message", debugIpc);
  const unwatch = await Fs.watchDirectory("assets/.fiasco", (event, path) => {
    if (path === "default.scene.json" && event === "change") {
      hasSceneUpdate.value = true;
    }
  });
  cleanup.track("watchDirectory", unwatch);
});

onHide(() => {
  releaseLogs();
  window.removeEventListener("message", debugIpc);
  cleanup.closeAll();
});

async function refreshScene() {
  const scene = await Fs.readFile("assets/.fiasco/default.scene.json");
  const game = useGame();
  const oldScene = game.context.scene;
  const newScene = new Thing(JSON.parse(scene));

  const sceneMap = new Map<string, Thing>();
  for (const thing of newScene.all()) {
    sceneMap.set(thing.id, thing);
  }
  for (const thing of oldScene.all()) {
    if (!sceneMap.has(thing.id)) {
      assert(
        thing.parent,
        `Dynamically added thing ${thing.id} has no parent, can't reconcile`
      );
      assert(
        sceneMap.has(thing.parent.id),
        `Dynamically added thing ${thing.id} has parent ${thing.parent.id} which is not in the new scene`
      );

      console.log("adding", thing.id, "to", thing.parent.id);

      sceneMap.get(thing.parent.id)!.add(thing);
      for (const t of thing.all()) {
        sceneMap.set(t.id, t);
      }
    }
  }

  game.context.scene = newScene;

  hasSceneUpdate.value = false;
}

function debugIpc(_event: MessageEvent) {
  // uncomment this for debugging ipc
  // console.log("inspector received message", _event.origin, _event.data);
}
</script>

<template>
  <main :class="{ loading: !loaded }">
    <div
      class="notification bg-plue text-light absolute top-0 left-0 right-0 text-center cursor-pointer z-10 flex items-center justify-center"
      @click="refreshScene"
      v-if="hasSceneUpdate"
    >
      <div class="cursor-pointer font-bold text-tiny">
        Changes have been made to the scene! Reload to see the latest updates
        <i class="iconoir-refresh-double"></i>
      </div>
    </div>
    <div class="grid">
      <section class="hierarchy card">
        <Hierarchy v-if="gameRef" :scene="sceneRef" />
      </section>
      <section class="game">
        <GameComponent />
        <div class="playbar-cnr">
          <Playbar />
        </div>
      </section>
      <section class="logs card nopad">
        <Console />
      </section>
      <section class="inspector card nopad">
        <Inspect v-if="gameRef" :game="gameRef as Game<unknown>" />
      </section>
    </div>
    <Flyout />
  </main>
</template>

<style scoped>
main {
  min-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding: 24px 16px 16px;
  position: relative;
}

section.game {
  position: relative;
}

.playbar-cnr {
  display: flex;
  justify-content: center;
}

.grid {
  height: calc(100vh - 32px);
  display: grid;
  gap: 1vw;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: 2fr 2.5fr;
}

main.loading .grid {
  grid-template-columns: 20vw 0 50vw 20vw;
}

section {
  padding: 1.6rem;
}
section.nopad {
  padding: 1.6rem 0 0;
}

.hierarchy {
  grid-column: 1;
  grid-row: 1 / span 2;
}
.game {
  grid-column: 2 / span 2;
  grid-row: 1;
}
.logs {
  grid-column: 2 / span 2;
  grid-row: 2;
}
.inspector {
  grid-column: 4;
  grid-row: 1 / span 2;
}

section {
  position: relative;

  padding-top: 16px;
}

.notification {
  height: 2rem;
}

.notification i {
  position: relative;
  top: 1px;
  left: 2px;
}
</style>
