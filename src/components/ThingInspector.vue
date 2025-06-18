<script setup lang="ts">
import {
  type Thing,
  rad2deg,
  deg2rad,
  assert,
  type Color,
  Colors,
} from "@vaguevoid/sdk";
import { paint } from "../models/game";
import { selectOnFocus, swallowKey } from "../models/htmlInput";
import { label } from "../models/util";
import ExpandableLabel from "./ExpandableLabel.vue";

const props = defineProps<{
  thing: Thing;
  shouldHideLabel?: boolean;
}>();

function rotate(value: number) {
  assert(props.thing);
  props.thing.rotation = deg2rad(value);
  paint();
}

function onChange() {
  paint();
}

function changeColor(value: string) {
  props.thing.color = Colors.hex(value);
  onChange();
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? `0${hex}` : hex;
}

function colorToHex(color: Color) {
  return `#${componentToHex(color.r * 255)}${componentToHex(
    color.g * 255
  )}${componentToHex(color.b * 255)}`;
}
</script>

<template>
  <div class="thing level level-1" :class="{ hideLabel: shouldHideLabel }">
    <ExpandableLabel :is-expanded="true" v-show="!props.shouldHideLabel">
      {{ label(thing) }}
    </ExpandableLabel>
    <div class="level-n">
      <label class="row field leaf">
        <div class="label">isVisible</div>
        <input
          type="checkbox"
          :checked="thing.isVisible"
          @focus="selectOnFocus"
          @change="(e) => { thing.isVisible = (e.target as HTMLInputElement).checked; onChange();}"
        />
      </label>
      <div class="row multi field leaf">
        <div class="label">Position</div>
        <div class="input-cnr">
          <span>X</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.x"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
        <div class="input-cnr">
          <span>Y</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.y"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
      </div>
      <label class="row field leaf">
        <div class="label">Layer Order</div>
        <div class="input-cnr" style="width: 11.2rem">
          <span>Z</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.z"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
      </label>
      <div class="row multi field">
        <div class="label">Dimensions</div>
        <div class="input-cnr">
          <span>W</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.width"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
        <div class="input-cnr">
          <span>H</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.height"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
      </div>
      <div class="row multi field">
        <div class="label">Scale</div>
        <div class="input-cnr">
          <span>X</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.scale.x"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
        <div class="input-cnr">
          <span>Y</span>
          <input
            type="number"
            @focus="selectOnFocus"
            v-model="thing.scale.y"
            @change="onChange"
            @keydown="swallowKey"
          />
        </div>
      </div>
      <label class="row field leaf">
        <div class="label">Rotation</div>
        <input
          type="number"
          @focus="selectOnFocus"
          :value="Math.floor(rad2deg(thing.rotation))"
          @change="(e) => rotate(Number((e.target as HTMLInputElement).value))"
        />
      </label>
      <label class="row field leaf">
        <div class="label">Texture</div>
        <input
          type="text"
          @focus="selectOnFocus"
          v-model="thing.texturePath"
          @change="onChange"
        />
      </label>

      <label class="row field leaf">
        <div class="label">color</div>
        <input
          type="color"
          @focus="selectOnFocus"
          :value="colorToHex(thing.color)"
          @change="(e) => { changeColor((e.target as HTMLInputElement).value) }"
        />
      </label>

      <label class="row field leaf">
        <div class="label">id</div>
        <input
          type="text"
          @focus="selectOnFocus"
          v-model="thing.id"
          @change="onChange"
        />
      </label>
      <label class="row field leaf">
        <div class="label">tags</div>
        <input
          type="text"
          @focus="selectOnFocus"
          :value="thing.tags.join(' ')"
          @change="(e) => { thing.tags = (e.target as HTMLInputElement).value.split(' '); onChange();}"
        />
      </label>
    </div>
  </div>
</template>

<style scoped>
.hideLabel .level-n {
  margin-left: 0;
  padding-left: 0;
}
label {
  display: block;
}
</style>
