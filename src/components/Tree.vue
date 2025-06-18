<script setup lang="ts">
import { Thing } from "@vaguevoid/sdk";
import TreeNodeView from "./TreeNode.vue";
import { onMounted, reactive } from "vue";
import { loadExpandedThings } from "../models/inspect";

const t = reactive(new Thing());

defineProps<{
  root: Thing | typeof t;
}>();

onMounted(() => {
  loadExpandedThings();
});
</script>

<template>
  <ul class="tree">
    <TreeNodeView :root="root" :thing="root" :indentation="0" />
  </ul>
</template>
