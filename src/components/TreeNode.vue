<script setup lang="ts">
import { Thing } from "@vaguevoid/sdk";
import { reactive } from "vue";
import {
  blur,
  hover,
  select,
  selectedThing,
  isExpanded,
  expand,
  collapse,
  flyoutAnchor,
} from "../models/inspect";
import { paint } from "../models/game";
import { label } from "../models/util";
import { treeQuery } from "../models/filter";
import ExpandableLabel from "./ExpandableLabel.vue";

const t = reactive(new Thing());

const props = defineProps<{
  thing: Thing | typeof t;
  root: Thing | typeof t;
  indentation: number;
}>();

// can't use css hover bc it covers multiple li elements and buttons
function mouseenter() {
  hover(props.thing as Thing);
  paint();
}

function mouseleave() {
  blur();
}

let clickTime = -1;

function click(e: MouseEvent) {
  if (props.thing == props.root && performance.now() - clickTime > 500) {
    clickTime = performance.now();
    return;
  }

  const target = e.target as HTMLElement;
  let textSpan = target.querySelector("span");
  if (!textSpan) {
    textSpan = target;
  }

  flyoutAnchor.value = textSpan;

  select(props.thing as Thing);
  expand(props.thing.id);
}
</script>

<template>
  <li
    :id="thing.id"
    @mouseenter="mouseenter"
    @mouseleave="mouseleave"
    class="level"
    :class="{
      'level-1': props.indentation === 0,
      'level-2': props.indentation === 1,
      'level-n': props.indentation > 1,
    }"
  >
    <ExpandableLabel
      v-if="!!thing.kids?.length"
      :isExpanded="isExpanded(thing.id)"
      :expand="() => expand(thing.id)"
      :collapse="() => collapse(thing.id)"
      @click="click"
      :class="{ selected: selectedThing?.id === thing.id }"
    >
      <span>{{ label(thing as any) }}</span>
    </ExpandableLabel>
    <div
      v-else
      class="leaf row"
      @click="click"
      :class="{ selected: selectedThing?.id === thing.id }"
    >
      <span>{{ label(thing as any) }}</span>
    </div>

    <ul v-if="!!thing.kids && (isExpanded(thing.id) || !!treeQuery)">
      <tree-node
        :root="root"
        v-for="kid of thing.kids"
        :thing="kid"
        :indentation="indentation + 1"
      />
    </ul>
  </li>
</template>

<style scoped>
button {
  padding: 0 0.5rem;
  margin-left: 0.5rem;
}

.selected {
  color: var(--plue);
}

.caret {
  display: inline-block;
}
svg {
  display: inline-block;
}

.row {
  cursor: pointer;
}
</style>
