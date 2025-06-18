<script setup lang="ts">
import { onMounted, ref } from "vue";

const playButton = ref<HTMLDivElement | null>(null);

onMounted(() => {
  setTimeout(() => {
    if (!playButton.value) {
      return;
    }
    playButton.value.classList.add("hiding");
  }, 125);

  setTimeout(() => {
    if (!playButton.value) {
      return;
    }
    playButton.value.classList.add("hidden");
  }, 125);
});
</script>

<template>
  <div
    ref="playButton"
    class="inline-flex items-center justify-center w-32 h-32 bg-pluetral-800 rounded-full"
  >
    <img src="/images/PlayButton.svg" />
  </div>
</template>

<style scoped>
div {
  animation: appear 125ms;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  margin: auto;
}

div.hiding {
  animation: appear 125ms reverse;
}

div.hidden {
  display: none;
}

@keyframes appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
