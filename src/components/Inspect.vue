<script setup lang="ts">
import { selectedThing } from "../models/inspect";
import StateInspector from "./StateInspector.vue";
import { Game } from "@vaguevoid/tools";
import SectionPill from "./SectionPill.vue";
import { onMounted, toRaw } from "vue";
import { stopScroll } from "../models/htmlInput";

defineProps<{
  game: Game<unknown>;
}>();

onMounted(() => {
  selectedThing.value = null;
});
</script>

<template>
  <SectionPill name="Inspect" />

  <div class="overflow-auto selectable" tabindex="0" @keydown="stopScroll">
    <StateInspector class="pl-4 pr-4" :game="game" />
  </div>
</template>

<style scoped>
.overflow-auto {
  overflow: auto;
  max-height: 100%;

  -ms-overflow-style: none;
  scrollbar-width: none;
}
.overflow-auto::-webkit-scrollbar {
  display: none;
}

.selectable {
  outline: none;
}

.warning {
  padding: 8px;
  @apply bg-kiwi;
}

.scrollable {
  overflow: auto;
}
</style>
