import { reactive } from "vue";
import { paint, useGame } from "./game";
import { Game } from "@vaguevoid/sdk";
import * as sdk from "@vaguevoid/sdk";

type LogKind =
  | "input"
  | "network"
  | "systems"
  | "painter"
  | "game"
  | "error"
  | "repl"
  | "unknown";

type Level = "debug" | "info" | "warning" | "error";

type Log = {
  message: string;
  id: string;
  time: number;
  frame: number;
  level?: Level;
  kind: LogKind;
};

let id = 0;

let unsubscribe: (() => void) | null = null;
let commandHistory = [] as string[];
let commandIndex = -1;
export const logs = reactive<Log[]>([]);

export const addLog = (
  message: string,
  kind: LogKind = "game",
  type: Level = "info"
) => {
  const game = useGame();

  if (logs.length > 1000) {
    logs.shift();
  }

  logs.push({
    id: String(id++),
    message,
    time: game.context.time.now,
    frame: game.context.frame,
    level: type,
    kind,
  });
};

export function clearLogs() {
  logs.splice(0, logs.length);
}

export function captureLogs(): () => void {
  const originalLog = globalThis.console.log.bind(globalThis.console);
  const originalError = globalThis.console.error.bind(globalThis.console);

  globalThis.console.log = function log(...args) {
    originalLog(...args);

    let game: Game<unknown> | null = null;
    try {
      game = useGame();
    } catch (e) {
      console.warn(e);
    }

    if (logs.length > 1000) {
      logs.shift();
    }

    logs.push({
      // append json stringified args to msg
      message: args.map(printObject).join(" "),
      id: String(id++),
      time: game?.context.time.now ?? 0,
      frame: game?.context.frame ?? 0,
      level: "info",
      kind: "game",
    });
  };

  globalThis.console.error = function error(...args) {
    originalError(...args);

    let game: Game<unknown> | null = null;
    try {
      game = useGame();
    } catch (e) {
      console.warn(e);
    }

    if (logs.length > 1000) {
      logs.shift();
    }

    logs.push({
      message: args.map(printObject).join(" "),
      id: String(id++),
      time: game?.context.time.now ?? 0,
      frame: game?.context.frame ?? 0,
      level: "error",
      kind: "game",
    });
  };

  return (unsubscribe = () => {
    globalThis.console.log = originalLog;
    globalThis.console.error = originalError;
  });
}

export function releaseLogs() {
  if (!unsubscribe) {
    return false;
  }
  unsubscribe();
  return true;
}

export function getTrace() {
  const trace = new Error().stack;

  return (
    trace
      ?.split("\n")
      // filter out node_modules calls
      .filter((t) => t.trim() != "Error")
      .filter((t) => !t.match(/node_modules/))
      // filter out logger.ts
      .filter((t) => !t.match(/logger.ts/))
      .map((t) =>
        t
          // remove 'at'
          .replace(/$ at/, "")
          // remove url
          .replace("http://localhost:1420/", "")
          // remove timestamp in asset hash
          .replace(/\?t=.*?:/, ":")
      )[0] || ["<no stack trace>"]
  );
}

export function runReplCommand(command: string): boolean {
  if (!command) {
    return false;
  }

  const globalWindow = window as any;
  const hadGlobalContext = "context" in window;
  const hadGlobalState = "state" in window;
  const hadGlobalSdk = "sdk" in window;

  const game = useGame();

  // set context and state on window for eval
  // so that the user can access them in the repl
  if (!hadGlobalContext) {
    globalWindow.context = game.context;
  }
  if (!hadGlobalState) {
    globalWindow.state = game.context.state;
  }
  if (!hadGlobalSdk) {
    globalWindow.sdk = sdk;
  }

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval
  try {
    // eval user code in strict mode. while eval is a security risk,
    // this is no different than the user opening the chrome inspector and typing in the console
    // eslint-disable-next-line no-eval
    const ret = eval?.(`"use strict"; ${command}`);
    // log the results, json stringify for objects and arrays
    addLog(JSON.stringify(ret, null, 2), "repl");
    // repaint the game in case they changed state etc
    paint();
  } catch (e) {
    console.error(e);
    return false;
  }

  // if the gamedev hadn't set their own context or state on the window object,
  // remove the context and state we added
  if (!hadGlobalContext) {
    delete (window as any).context;
  }
  if (!hadGlobalState) {
    delete (window as any).state;
  }
  if (!hadGlobalSdk) {
    delete (window as any).sdk;
  }

  return true;
}

export function addCommandToHistory(command: string) {
  commandHistory.unshift(command);
}

export function getPreviousCommand() {
  commandIndex = Math.min(commandIndex + 1, commandHistory.length - 1);
  return commandHistory[commandIndex];
}

export function peekLastCommand() {
  return commandHistory[0];
}

export function resetCommandIndex() {
  commandIndex = -1;
}

export function getNextCommand() {
  commandIndex = Math.max(commandIndex - 1, -1);
  return commandHistory[commandIndex];
}

function printObject(o: any) {
  if (o instanceof Error) {
    return o.stack ?? o.message;
  }
  if (typeof o === "object") {
    return JSON.stringify(o, null, 2);
  }
  return o;
}
