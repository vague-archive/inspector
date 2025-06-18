<script setup lang="ts">
import IconCaretDown from "./icons/IconCaretDown.vue";
import IconCaretRight from "./icons/IconCaretRight.vue";

const props = defineProps<{
  isExpanded: boolean;
  collapse?: () => void;
  expand?: () => void;
}>();

function click() {
  if (props.isExpanded) {
    props.collapse?.();
  } else {
    props.expand?.();
  }
}
</script>

<template>
  <div class="expandable row" :class="{ expanded: isExpanded }">
    <span class="caret" @click="click">
      <IconCaretDown />
      <IconCaretRight />
    </span>
    <span class="label">
      <slot />
    </span>
  </div>
</template>

<style scoped>
.expandable {
  display: flex;
  align-items: center;
  width: 100%;
}

.caret-down {
  margin-right: 0.2rem;
}
/* right svg is 2px larger than caret-down */
.caret-right {
  margin-right: 0.4rem;
}

.caret-down {
  display: none;
}

.caret-right {
  display: inline-block;
}

.expanded .caret-down {
  display: inline-block;
}

.expanded .caret-right {
  display: none;
}
</style>
