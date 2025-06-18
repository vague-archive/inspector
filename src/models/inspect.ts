import { Camera, System, Thing } from "@vaguevoid/sdk";
import { ref } from "vue";
import { paint } from "./game";
import { highlightRect, hoverRect } from "./util";

export const selectedThing = ref<Thing | null>(null);
export const hoveredThing = ref<Thing | null>(null);
export const inspectedCamera = ref<Camera | null>(null);

export const expanded = ref<string[]>([]);

export const flyoutAnchor = ref<HTMLElement | null>(null);

export function select(thing: Thing) {
  selectedThing.value = thing;
  inspectedCamera.value = null;
}

export function deselect() {
  selectedThing.value = null;
}

export function hover(thing: Thing) {
  hoveredThing.value = thing;
  paint();
}

export function blur() {
  hoveredThing.value = null;
  paint();
}

export function expand(id: string) {
  expanded.value.push(id);
  saveExpandedThings();
}

export function collapse(id: string) {
  expanded.value = expanded.value.filter((i) => i !== id);
  saveExpandedThings();
}

export function isExpanded(id: string) {
  return expanded.value.includes(id);
}

export function saveExpandedThings() {
  localStorage.setItem("expandedThings", JSON.stringify(expanded.value));
}

export function loadExpandedThings() {
  const expandedThings = localStorage.getItem("expandedThings");
  if (expandedThings) {
    expanded.value = JSON.parse(expandedThings);
  }
}

export const paintSelectionsSystem = {
  label: "Inspector > Gizmos",
  paint(painter) {
    if (selectedThing.value) {
      highlightRect(painter, selectedThing.value as Thing);
    }
    if (hoveredThing.value) {
      hoverRect(painter, hoveredThing.value as Thing);
    }
  },
} satisfies System<unknown>;
