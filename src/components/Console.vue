<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  addCommandToHistory,
  addLog,
  clearLogs,
  getNextCommand,
  getPreviousCommand,
  logs,
  peekLastCommand,
  resetCommandIndex,
  runReplCommand,
} from "../models/console";
import { assert, Key, MouseButton } from "@vaguevoid/sdk";
import { shouldPropagate } from "../models/htmlInput";
import SectionPill from "./SectionPill.vue";
import { Ipc } from "@vaguevoid/tools";
import { useGameAsync } from "../models/game";
import { onHide, onShow } from "../models/util";
import { Cleanup } from "../models/cleanup";

const scroll = ref<HTMLDivElement | null>(null);

const cleanup = new Cleanup();

onShow(async () => {
  const game = await useGameAsync();

  cleanup.track(
    "console-commandPalette",
    Ipc.registerCommandPaletteShortcuts([
      {
        id: "console-clear",
        name: "Clear Logs",
        description: "Clear the console",
        shortcut: ["ctrl", "l"],
        action() {
          clearLogs();
        },
      },
    ])
  );

  cleanup.track(
    "beforeSystem",
    game.beforeSystem.connect((ctx, system) => {
      if (ctx.frame < 1) {
        return;
      }

      if (system.label?.startsWith("Void")) {
        return;
      }

      // todo neil: remove this once https://github.com/vaguevoid/sdk/pull/466 lands
      if (game.systems.indexOf(system) === 0) {
        return;
      }

      const voidSystems = game.systems.filter((s) =>
        s.label?.startsWith("Void")
      );
      const index = Math.max(
        0,
        game.systems.indexOf(system) - voidSystems.length
      );
      const className = ["Object", "Function"].includes(system.constructor.name)
        ? ""
        : system.constructor.name;

      if (game.isPaused) {
        // addLog(system.label || className || `system ${index}`, "systems");
      }
    })
  );

  cleanup.track(
    "beforeFrame",
    game.beforeFrame.connect((ctx) => {
      // todo neil: don't skip this once we can control the frames better
      if (ctx.frame < 1) {
        return;
      }

      if (game.isPaused) {
        addLog(`== frame ${ctx.frame} start ==`, "systems");

        if (ctx.inputs.keyboard.down.size > 0) {
          const keys = Array.from(ctx.inputs.keyboard.down)
            .map((k) => Key[k])
            .filter((k) => k !== "Period" && k !== "Comma");

          if (keys.length) {
            addLog(`keydown: ${keys.join(", ")}`, "input");
          }
        }
        if (ctx.inputs.keyboard.up.size > 0) {
          const keys = Array.from(ctx.inputs.keyboard.up)
            .map((k) => Key[k])
            .filter((k) => k !== "Period" && k !== "Comma");
          if (keys.length) {
            addLog(`keyup: ${keys.join(", ")}`, "input");
          }
        }

        if (ctx.inputs.mouse.down.size > 0) {
          addLog(
            `mousedown: ${Array.from(ctx.inputs.mouse.down)
              .map((m) => MouseButton[m])
              .join(", ")}`,
            "input"
          );
        }

        if (ctx.inputs.mouse.up.size > 0) {
          addLog(
            `mouseup: ${Array.from(ctx.inputs.mouse.up)
              .map((m) => MouseButton[m])
              .join(", ")}`,
            "input"
          );
        }
      }

      if (ctx.inputs.isMouseDown("left")) {
        if (
          0 < ctx.inputs.mouse.x &&
          ctx.inputs.mouse.x < ctx.screen.width &&
          0 < ctx.inputs.mouse.y &&
          ctx.inputs.mouse.y < ctx.screen.height
        ) {
          addLog(
            `mousedown: (${ctx.inputs.mouse.x}, ${ctx.inputs.mouse.y})`,
            "input"
          );
        }
      }
    })
  );

  cleanup.track(
    "afterFrame",
    game.afterFrame.connect((ctx) => {
      // todo neil: don't skip this once we can control the frames better
      if (ctx.frame < 1) {
        return;
      }

      if (game.isPaused) {
        // addLog(`== frame ${ctx.frame} end ==`, "systems");
      }
    })
  );
});

onHide(() => {
  cleanup.closeAll();
});

watch(logs, async () => {
  // wait until dom is updated with new logs
  await nextTick();
  assert(scroll.value);

  // scroll to bottom
  scroll.value.scrollTo(0, scroll.value.scrollHeight);
});

function timeString(ms: number) {
  // if there are hours, show them
  // prettier-ignore
  const hours = ms > 1000 * 60 * 60 ? Math.floor(ms / (1000 * 60 * 60)).toString().padStart(2, "0") + ":" : "";
  // show minutes padded with 0s
  // prettier-ignore
  const minutes = Math.floor((ms / 1000 / 60) % 60).toString().padStart(2, "0") + ":";
  // always show seconds and milliseconds. drives me insane that unity doesn't show ms by default
  const seconds = Math.floor((ms / 1000) % 60);
  const milliseconds = Math.floor(ms % 1000);

  // prettier-ignore
  return `${hours}${minutes}${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
}

function replKeydown(e: KeyboardEvent) {
  if (!shouldPropagate(e)) {
    e.stopPropagation();
  }

  if (e.ctrlKey && e.key === "l") {
    clearLogs();
    return;
  }

  const inputElement = e.target as HTMLInputElement;
  const value = inputElement.value;

  if (e.key === "ArrowUp") {
    inputElement.value = getPreviousCommand() ?? "";
  }

  if (e.key === "ArrowDown") {
    inputElement.value = getNextCommand() ?? "";
  }

  if (e.key !== "Enter") {
    return;
  }

  if (peekLastCommand() !== value) {
    addCommandToHistory(value);
  }
  resetCommandIndex();

  if (runReplCommand(value)) {
    inputElement.value = "";
  }
}
</script>

<template>
  <SectionPill name="Console" />
  <div class="console">
    <div class="logs-cnr">
      <div class="logs pad" ref="scroll">
        <!-- prettier-ignore -->
        <div v-for="log in logs" :key="log.id" class="log" :class="`${log.kind} ${log.level}`">
          <div class="timestamp">f{{ log.frame }} | {{ timeString(log.time) }}</div>
          <pre>{{ log.message }}</pre>
        </div>
      </div>
    </div>

    <div class="repl-cnr pad">
      <span>&gt;</span>
      <input type="text" name="repl" @keydown="replKeydown" />
    </div>
  </div>
</template>

<style scoped>
.console {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}
.logs-cnr {
  flex: 1;
  position: relative;
}
.logs {
  overflow: auto;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 36px;
  right: 0;
  overscroll-behavior: contain;
}
.log.input {
  color: var(--grink600);
}
.log.systems {
  color: var(--blueb600);
}
.log.error {
  background-color: var(--ped100);
  border: 1px solid var(--ped500);
  color: var(--ped900);
}
.log {
  display: flex;
  font-size: var(--fontsmall);
  margin-bottom: 0.4rem;
  color: rgba(0, 0, 0, 0.6);
}

.timestamp {
  width: 11rem;
}
pre {
  flex: 1;
  margin: -0.1rem 0;
  padding: 0;
  font-family: var(--fiasco-family);
  font-weight: 600;
  color: inherit;
}

.pad {
  padding: 1vh 1vw;
}

.repl-cnr {
  display: flex;
  align-items: center;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 1px solid var(--plue);
}
.repl-cnr input {
  flex: 1;
  border: 0;
  outline: none;
}
</style>
