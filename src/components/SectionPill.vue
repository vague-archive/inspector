<script setup lang="ts">
defineProps<{
  name: string;
}>();
</script>

<template>
  <div class="pill small section-label">
    {{ name }}
  </div>
</template>

<style scoped>
.section-label {
  background-color: #fff;
  position: absolute;
  left: 8px;
  top: -12px;
}
</style>
