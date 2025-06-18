<script setup lang="ts">
import { Game } from "@vaguevoid/tools";
import { onMounted, reactive, ref, watch } from "vue";
import { frameNumber, snapshotUpdateTime } from "../models/game";
import { JsonEntry, parse, query } from "../models/jsonEditor";
import JsonNode from "./JsonNode.vue";
import { filter, loadExpanded, setMatches } from "../models/filter";
import { selectOnFocus, swallowKey } from "../models/htmlInput";

const props = defineProps<{
  game: Game<unknown>;
}>();

const inspectorState = reactive<JsonEntry[]>([]);

onMounted(() => {
  readState();
  loadExpanded();
});

function readState() {
  try {
    const jsonState = parse(props.game.context.state);
    inspectorState.push(...jsonState);
  } catch (e: any) {
    if (e.message?.startsWith("ParseFunctionError")) {
      return console.error(e.message);
    }
    throw e;
  }
}

watch([frameNumber, snapshotUpdateTime], () => {
  inspectorState.splice(0, inspectorState.length);
  readState();
});

watch(
  () => filter.value.queryString,
  () => {
    const { matches, parents } = query(
      inspectorState,
      filter.value.queryString
    );
    if (matches.length + parents.length < 1000) {
      setMatches(matches.concat(parents));
    }
  }
);
</script>

<template>
  <div v-if="game">
    <field-input class="mb-3 mt-3">
      <input
        type="text"
        v-model="filter.queryString"
        placeholder="Filter"
        @focus="selectOnFocus"
        @keydown="swallowKey"
      />
      <field-icon-left class="iconoir-search"></field-icon-left>
    </field-input>

    <ul>
      <JsonNode
        v-for="node of inspectorState"
        :node="node"
        :root="game.context.state"
        :indentation="0"
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
