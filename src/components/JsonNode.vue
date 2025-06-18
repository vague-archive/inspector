<script setup lang="ts">
import { paint } from "../models/game";
import { selectOnFocus, swallowKey } from "../models/htmlInput";
import { JsonEntry, patch, JsType } from "../models/jsonEditor";
import { filter, isExpanded, toggle } from "../models/filter";
import MatchText from "./MatchText.vue";
import ExpandableLabel from "./ExpandableLabel.vue";

const props = defineProps<{
  node: JsonEntry;
  parent?: JsonEntry;
  root: any;
  indentation: number;
}>();

function change(path: string, type: JsType, value: any) {
  if (type === "number") {
    value = parseFloat(value);
  }
  patch(props.root, path, value);

  paint();
}

function roundFloat(f: number) {
  return Math.round(f * 1000) / 1000;
}

// todo neil: do this with :class and v-model
// trying to use activePath led to input values getting reset
function highlight(el: HTMLElement) {
  el.classList.add("active");
  while (el.parentElement && el.parentElement.tagName !== "SECTION") {
    el = el.parentElement;
    el.classList.add("activeParent");
  }
}

function blur(el: HTMLElement) {
  el.classList.remove("active");
  while (el.parentElement && el.parentElement.tagName !== "SECTION") {
    el = el.parentElement;
    el.classList.remove("activeParent");
  }
}

function titleize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
</script>

<template>
  <li
    @mouseover.stop="highlight($el)"
    @mouseout.stop="blur($el)"
    v-if="!filter.queryString || filter.queryMatches.includes(node.path)"
    class="level"
    :class="{
      [node.type]: true,
      'level-1': indentation === 0,
      'level-2': indentation === 1,
      'level-n': indentation > 1,
    }"
  >
    <div
      class="row"
      v-if="['object', 'array'].includes(node.type)"
      @click="toggle(node.path)"
      :class="{
        arrayElement: parent?.type === 'array',
        branch: node.kids.length > 0,
      }"
    >
      <ExpandableLabel
        :is-expanded="
          node.kids.length === 0 ||
          isExpanded(node.path) ||
          !!filter.queryString
        "
      >
        <div v-if="parent?.type !== 'array'">
          {{ titleize(node.key) }}
        </div>
        <div v-else>
          {{ parent?.key ? titleize(parent.key.replace(/s$/, "")) : "Item" }}
          {{ node.key }}
        </div>
      </ExpandableLabel>
    </div>
    <div v-else-if="node.type == 'thing'">
      <div class="row" @click="toggle(node.path)">
        <ExpandableLabel
          :is-expanded="isExpanded(node.path)"
          :expand="() => toggle(node.path)"
          :collapse="() => toggle(node.path)"
        >
          {{ titleize(node.key) }}
        </ExpandableLabel>
      </div>
    </div>
    <div v-else-if="node.type == 'vector'" class="multi field row leaf">
      <div class="label">
        <MatchText
          :text="titleize(node.key)"
          :query="filter.queryString"
          :path="node.path"
        />
      </div>
      <div class="input-cnr">
        <span>X</span>
        <input
          :value="roundFloat(node.kids[0]!.value)"
          @focus="selectOnFocus"
          type="number"
          @keydown="swallowKey"
          @change="(e) => change(node.path + '.x', 'number', (e.target as HTMLInputElement).value)"
        />
      </div>
      <div class="input-cnr">
        <span>Y</span>
        <input
          :value="roundFloat(node.kids[1]!.value)"
          @focus="selectOnFocus"
          type="number"
          @keydown="swallowKey"
          @change="(e) => change(node.path + '.y', 'number', (e.target as HTMLInputElement).value)"
        />
      </div>
    </div>
    <label class="field" v-else-if="node.type == 'boolean'">
      <div class="label">
        <MatchText
          :text="titleize(node.key)"
          :query="filter.queryString"
          :path="node.path"
        />
      </div>
      <input
        type="checkbox"
        :checked="node.value"
        @focus="selectOnFocus"
        @change="(e) => change(node.path, node.type, (e.target as HTMLInputElement).checked)"
      />
    </label>
    <label class="row field leaf" v-else-if="node.type == 'number'">
      <div class="label">
        <MatchText
          :text="titleize(node.key)"
          :query="filter.queryString"
          :path="node.path"
        />
      </div>
      <input
        :value="roundFloat(node.value)"
        @focus="selectOnFocus"
        type="number"
        @keydown="swallowKey"
        @change="(e) => change(node.path, node.type, (e.target as HTMLInputElement).value)"
      />
    </label>
    <label class="row field leaf" v-else-if="node.type == 'string'">
      <div class="label">
        <MatchText
          :text="titleize(node.key)"
          :query="filter.queryString"
          :path="node.path"
        />
      </div>
      <input
        :value="node.value"
        @focus="selectOnFocus"
        type="text"
        @keydown="swallowKey"
        @change="(e) => change(node.path, node.type, (e.target as HTMLInputElement).value)"
      />
    </label>

    <ul
      v-if="
        node.type !== 'vector' &&
        node.kids.length &&
        (!!filter.queryString || filter.expanded.includes(node.path))
      "
    >
      <json-node
        :root="root"
        v-for="kid of node.kids.filter(
          (k) => !filter.queryString || filter.queryMatches.includes(k.path)
        )"
        :node="kid"
        :parent="node"
        :indentation="props.indentation + 1"
      />
    </ul>
  </li>
</template>

<style scoped>
ul {
  list-style-type: none;
  padding: 0px;
}

.isMatch {
  @apply bg-jiggly-300;
}

.row {
  cursor: pointer;
}

.field,
.branch {
  user-select: none;
}
</style>
