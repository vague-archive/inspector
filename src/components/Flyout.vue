<script lang="ts" setup>
import { assert, Thing } from "@vaguevoid/sdk";
import {
  selectedThing,
  flyoutAnchor,
  deselect,
  inspectedCamera,
} from "../models/inspect";
import ThingInspector from "./ThingInspector.vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toRaw,
  watch,
} from "vue";
import { label } from "../models/util";
import CameraInspector from "./CameraInspector.vue";

const thing = computed(() => toRaw(selectedThing.value) as Thing);

const flyoutContainer = ref<HTMLElement | null>(null);

const position = ref({
  x: 0,
  y: 0,
});

let mouseOffset = {
  x: 0,
  y: 0,
};

const wantsDrag = ref(false);
const isDragging = ref(false);

onMounted(() => {
  window.addEventListener("mousemove", mousemove);
  window.addEventListener("mouseup", mouseup);
  window.addEventListener("keydown", keydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", mousemove);
  window.removeEventListener("mouseup", mouseup);
  window.removeEventListener("keydown", keydown);
});

watch([selectedThing, inspectedCamera], ([t, c]) => {
  if (t || c) {
    // wait for the flyout to have a size before repositioning
    nextTick(reposition);
  }
});

function keydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    close();
  }
}

function mousemove(e: MouseEvent) {
  if (wantsDrag.value) {
    position.value.x = e.clientX - mouseOffset.x;
    position.value.y = e.clientY - mouseOffset.y;

    isDragging.value = true;
  }
}

function mouseup() {
  isDragging.value = false;
  wantsDrag.value = false;
}

function mousedown(e: MouseEvent) {
  assert(flyoutContainer.value, `Mounted flyout without container`);

  const rect = flyoutContainer.value.getBoundingClientRect();
  mouseOffset = { x: e.clientX - rect.x, y: e.clientY - rect.y };
  wantsDrag.value = true;
}

function reposition() {
  assert(flyoutAnchor.value, `Mounted flyout without text anchor`);
  assert(flyoutContainer.value, `Mounted flyout without container`);

  const bounds = flyoutAnchor.value.getBoundingClientRect();
  const dimensions = flyoutContainer.value.getBoundingClientRect();

  assert(dimensions.height, `Flyout dimensions are not available`);

  const windowBottom = window.innerHeight;

  position.value.x = bounds.right + 16;
  position.value.y = bounds.top;
  if (position.value.y + dimensions.height > windowBottom) {
    position.value.y = windowBottom - dimensions.height - 16;
  }
}

function close() {
  deselect();
  inspectedCamera.value = null;
}
</script>

<template>
  <div
    class="flyout"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
    ref="flyoutContainer"
    @mousedown="mousedown"
  >
    <modal-card v-if="selectedThing || inspectedCamera">
      <modal-toolbar>
        <modal-close-button @click="close">
          <i class="iconoir-xmark"></i>
        </modal-close-button>
      </modal-toolbar>
      <card>
        <card-header v-if="inspectedCamera">Camera</card-header>
        <card-header v-else-if="selectedThing">{{ label(thing) }}</card-header>
        <card-body>
          <div class="shield" v-show="isDragging" @click.stop.prevent></div>
          <CameraInspector v-if="inspectedCamera" :camera="inspectedCamera" />
          <ThingInspector
            v-if="selectedThing"
            :thing="thing"
            :shouldHideLabel="true"
          />
        </card-body>
      </card>
    </modal-card>
  </div>
</template>

<style scoped>
.flyout {
  position: absolute;
  z-index: 3;
}

/*
  the purpose of this is to prevent accidental clicks on boolean inputs
  or other fields when the dev is attempting to drag the flyout
*/
.shield {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  z-index: 1;
}

card {
  min-width: 24rem;
}

modal-close-button {
  cursor: pointer;
}
</style>
