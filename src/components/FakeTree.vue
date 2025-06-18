<script setup lang="ts">
// this is a fake tree with fake data for easy iteration on css with designers

import { ref } from "vue";
import ExpandableLabel from "./ExpandableLabel.vue";

const isExpanded = ref(false);

function fakeExpand() {
  isExpanded.value = true;
}

function fakeCollapse() {
  isExpanded.value = false;
}
</script>

<template>
  <ul class="select-none">
    <li class="level level-1">
      <ExpandableLabel
        :isExpanded="isExpanded"
        :collapse="fakeCollapse"
        :expand="fakeExpand"
      >
        Parent
      </ExpandableLabel>
      <ul v-show="isExpanded">
        <li class="level level-2">
          <ExpandableLabel
            :isExpanded="isExpanded"
            :collapse="fakeCollapse"
            :expand="fakeExpand"
          >
            Child
          </ExpandableLabel>
          <ul>
            <li class="level level-n">
              <ExpandableLabel
                :isExpanded="isExpanded"
                :collapse="fakeCollapse"
                :expand="fakeExpand"
              >
                Grandchild 1
              </ExpandableLabel>
              <ul>
                <li class="level level-n">
                  <div class="leaf row">
                    <span class="label">Great Grandchild 1</span>
                  </div>
                </li>
                <li class="level level-n">
                  <ExpandableLabel
                    :isExpanded="isExpanded"
                    :collapse="fakeCollapse"
                    :expand="fakeExpand"
                  >
                    Great Grandchild 2
                  </ExpandableLabel>
                </li>
              </ul>
            </li>
            <li class="level level-n">
              <div class="leaf row">
                <span class="label">Grandchild 2</span>
              </div>
            </li>
            <li class="level level-n">
              <ExpandableLabel
                :isExpanded="isExpanded && false"
                :collapse="fakeCollapse"
                :expand="fakeExpand"
              >
                Grandchild 3
              </ExpandableLabel>
            </li>
            <li class="level level-n selected">
              <ExpandableLabel
                :isExpanded="isExpanded"
                :collapse="fakeCollapse"
                :expand="fakeExpand"
              >
                Grandchild 4
              </ExpandableLabel>
            </li>
          </ul>
        </li>
        <li class="level level-2">
          <div class="leaf row">
            <span class="label">Child 2</span>
          </div>
          <div class="branch row">
            <ExpandableLabel
              :isExpanded="false"
              :collapse="() => {}"
              :expand="() => {}"
            >
              Child kids
            </ExpandableLabel>
          </div>
          <div class="row">
            <ExpandableLabel
              :isExpanded="true"
              :collapse="() => {}"
              :expand="() => {}"
            >
              Child no kids
            </ExpandableLabel>
          </div>
        </li>
      </ul>
    </li>
  </ul>
</template>

<style scoped>
.level .row:after {
  content: "";
  height: 0.4rem;
}

.selected .row {
  @apply text-plue;
  font-weight: 700;
}
</style>
