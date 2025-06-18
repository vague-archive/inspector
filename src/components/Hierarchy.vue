<script setup lang="ts">
import { Thing } from "@vaguevoid/sdk";
import { onMounted, reactive, ref } from "vue";
import { EditorPainter } from "../models/EditorPainter";
import Tree from "./Tree.vue";
import SectionPill from "./SectionPill.vue";
import { stopScroll } from "../models/htmlInput";
import { useGame } from "../models/game";
import { flyoutAnchor, inspectedCamera } from "../models/inspect";

const t = reactive(new Thing());

const things = ref<Thing[]>([]);

defineProps<{
  scene: Thing | typeof t;
}>();

onMounted(() => {
  const game = useGame();
  game.afterFrame.connect((ctx) => {
    things.value = Array.from((ctx.painter as EditorPainter).things);
  });
});

function inspectCamera(e: MouseEvent) {
  const target = e.target as HTMLElement;
  let textSpan = target.querySelector("span");
  if (!textSpan) {
    textSpan = target;
  }

  flyoutAnchor.value = textSpan;

  const game = useGame();
  inspectedCamera.value = game.context.camera;
}
</script>

<template>
  <SectionPill name="Things" />

  <div class="overflow-auto selectable" tabindex="0" @keydown="stopScroll">
    <div class="inspect-camera ml-2" @click="inspectCamera">
      <span class="level-1">Camera</span>
    </div>
    <Tree v-if="scene.kids.length" :root="scene" />
    <Tree v-for="thing in things" :root="thing" :key="thing.id" />
  </div>
</template>

<style scoped>
.overflow-auto {
  overflow: auto;
  max-height: 100%;
}

.selectable {
  outline: none;
}

.inspect-camera {
  font-weight: 700;
  color: black;
  font-size: var(--fontnormal);
}
.inspect-camera span {
  cursor: pointer;
}
.inspect-camera span:hover {
  background-color: var(--plue);
  color: white;
}
</style>
