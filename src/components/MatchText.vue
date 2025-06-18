<script setup lang="ts">
import { getMatchParts } from "../models/filter";

defineProps<{
  text: string;
  query: string;
  path?: string;
}>()
</script>

<template>
<div v-if="query">
  <span v-for="part in getMatchParts(query, text, path)" :class="{isMatch: part.isMatch}">
    {{ part.string }}
  </span>
</div>
<div v-else>
  {{ text }}
</div>
</template>

<style scoped>
.isMatch {
  background-color: var(--grink300);
}
</style>