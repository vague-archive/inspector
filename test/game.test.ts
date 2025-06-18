import { describe, it, expect } from "vitest";
import {
  jumpBack,
  jumpForward,
  setGame,
  stepBack,
  stepForward,
} from "../src/models/game";
import { Key, TestInputSource } from "@vaguevoid/sdk";
import { Game } from "@vaguevoid/sdk";

describe("game", () => {
  it("should set game", () => {
    const game = new Game({}, []);
    setGame(game);
    expect(game).toBe(game);
  });

  describe("stepBack", () => {
    it("steps back to a previous frame", () => {
      const game = new Game(
        {
          count: 0,
        },
        {
          update(state) {
            state.count++;
          },
        }
      );

      setGame(game);
      game.step();
      expect(game.context.state.count).toEqual(1);
      stepBack();
      expect(game.context.state.count).toEqual(0);
      game.step();
      game.step();
      expect(game.context.state.count).toEqual(2);
      stepBack();
      expect(game.context.state.count).toEqual(1);
    });
  });

  it("reruns logic after stepping back", () => {
    const game = new Game(
      {
        count: 0,
      },
      {
        update(state) {
          state.count++;
        },
      }
    );

    setGame(game);
    game.step();
    expect(game.context.state.count).toEqual(1);
    game.step();
    expect(game.context.state.count).toEqual(2);
    stepBack();
    expect(game.context.state.count).toEqual(1);
    game.systems = [
      {
        update(state) {
          state.count = 42;
        },
      },
    ];
    stepForward();
    expect(game.context.state.count).toEqual(42);
  });

  it("replays inputs when stepping forward", () => {
    const game = new Game(
      {
        count: 0,
      },
      {
        update(state, ctx) {
          const { inputs } = ctx;
          if (inputs.isKeyHeld("A")) {
            state.count++;
          }
        },
      }
    );

    setGame(game);
    const inputSource = new TestInputSource();
    game.inputSource = inputSource;
    inputSource.receiveKeydown(Key.A);
    game.step();
    expect(game.context.state.count).toEqual(1);
    inputSource.receiveKeydown(Key.A);
    game.step();
    expect(game.context.state.count).toEqual(2);
    stepBack();
    expect(game.context.state.count).toEqual(1);
    // this simulates a hot reload
    game.systems = [
      {
        update(state, ctx) {
          const { inputs } = ctx;
          if (inputs.isKeyHeld("A")) {
            state.count = 42;
          } else {
            state.count = 36;
          }
        },
      },
    ];
    stepForward();
    expect(game.context.state.count).toEqual(42);
  });

  it("replays inputs when jumping forward", () => {
    const game = new Game(
      {
        count: 0,
      },
      {
        update(state, ctx) {
          const { inputs } = ctx;
          if (inputs.isKeyHeld("A")) {
            state.count++;
          }
        },
      }
    );

    setGame(game);
    const inputSource = new TestInputSource();
    game.inputSource = inputSource;

    for (let i = 0; i < 150; i++) {
      inputSource.receiveKeydown(Key.A);
      game.step();
    }

    expect(game.context.state.count).toEqual(150);
    jumpBack();
    expect(game.context.frame).toEqual(1);
    expect(game.context.state.count).toEqual(1);
    stepBack();
    expect(game.context.frame).toEqual(0);
    expect(game.context.state.count).toEqual(0);

    game.systems = [
      {
        update(state, ctx) {
          const { inputs } = ctx;
          if (inputs.isKeyHeld("A")) {
            state.count += 2;
          }
        },
      },
    ];

    jumpForward();
    expect(game.context.state.count).toEqual(300);
  });

  it("retriggers a keydown when stepping back and forward", () => {
    const game = new Game(
      {
        count: 0,
      },
      {
        update(state, ctx) {
          const { inputs } = ctx;
          if (inputs.isKeyDown("A")) {
            state.count++;
          }
        },
      }
    );

    setGame(game);
    const inputSource = new TestInputSource();
    game.inputSource = inputSource;

    game.step();
    game.step();
    game.step();
    expect(game.context.frame).toEqual(3);
    expect(game.context.state.count).toEqual(0);

    inputSource.receiveKeydown(Key.A);
    game.step();
    expect(game.context.frame).toEqual(4);
    expect(game.context.state.count).toEqual(1);

    stepBack();
    expect(game.context.frame).toEqual(3);
    expect(game.context.state.count).toEqual(0);

    stepForward();
    expect(game.context.frame).toEqual(4);
    expect(game.context.state.count).toEqual(1);
  });

  it("remembers start functions", () => {
    const game = new Game(
      {},
      {
        start(state, ctx) {
          ctx.camera.zoom = 900;
        },
      }
    );

    setGame(game);
    expect(game.context.camera.zoom).toEqual(1);

    game.step();
    expect(game.context.camera.zoom).toEqual(900);
    game.step();
    expect(game.context.camera.zoom).toEqual(900);

    jumpBack();
    expect(game.context.camera.zoom).toEqual(900);
    expect(game.context.frame).toEqual(1);

    stepForward();
    expect(game.context.camera.zoom).toEqual(900);
    expect(game.context.frame).toEqual(2);
  });
});
