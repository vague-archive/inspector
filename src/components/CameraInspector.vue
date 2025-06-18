<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import { inspectedCamera } from "../models/inspect";
import { JsonEntry, parse } from "../models/jsonEditor";
import JsonNode from "./JsonNode.vue";

const cameraState = reactive<JsonEntry[]>([]);

onMounted(() => {
  if (inspectedCamera.value) {
    cameraState.push(...parse(inspectedCamera.value));
  }
});

watch(inspectedCamera, (camera) => {
  if (camera) {
    cameraState.push(...parse(camera));
  }
});
</script>

<template>
  <div>
    <ul>
      <JsonNode
        v-for="node of cameraState"
        :node="node"
        :root="inspectedCamera"
        :indentation="2"
      />
    </ul>
  </div>
</template>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
  margin-top: 0;
}
</style>
