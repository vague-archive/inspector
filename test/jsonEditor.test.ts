import { describe, expect, it } from "vitest";
import { parse, patch, query } from "../src/models/jsonEditor";
import { Thing, vec } from "@vaguevoid/sdk";

describe("jsonEditor", () => {
  describe(".parse", () => {
    it("understands a simple object", () => {
      const json = {
        cool: "nice",
        good: 1,
        great: false,
      };

      const displayData = parse(json);

      expect(displayData[0].key).toEqual("cool");
      expect(displayData[0].path).toEqual("cool");
      expect(displayData[0].type).toEqual("string");
      expect(displayData[0].value).toEqual("nice");

      expect(displayData[1].key).toEqual("good");
      expect(displayData[1].path).toEqual("good");
      expect(displayData[1].type).toEqual("number");
      expect(displayData[1].value).toEqual(1);

      expect(displayData[2].key).toEqual("great");
      expect(displayData[2].path).toEqual("great");
      expect(displayData[2].type).toEqual("boolean");
      expect(displayData[2].value).toEqual(false);
    });

    it("understands things", () => {
      const json = {
        unlabeled: new Thing(),
        labeled: new Thing({ label: "mything" }),
      };

      const displayData = parse(json);

      expect(displayData[0].key).toEqual("unlabeled");
      expect(displayData[0].type).toEqual("thing");
      expect(displayData[0].value).toEqual(json.unlabeled);

      expect(displayData[1].key).toEqual("labeled");
      expect(displayData[1].type).toEqual("thing");
      expect(displayData[1].value).toEqual(json.labeled);
    });

    it("works for vectors", () => {
      const json = {
        v: vec(1, 2),
      };

      const displayData = parse(json);

      expect(displayData[0].key).toEqual("v");
      expect(displayData[0].type).toEqual("vector");
      expect(displayData[0].value).toEqual([1, 2]);
    });

    it("regression: doesn't treat anything with only an x and y as a vector", () => {
      const json = {
        v: { x: [], y: [] },
      };

      const displayData = parse(json);

      expect(displayData[0].key).toEqual("v");
      expect(displayData[0].type).toEqual("object");
      expect(displayData[0].value).toEqual({ x: [], y: [] });
    });

    it("regression: doesn't max out call stack for a thing with kids", () => {
      const state = {
        cool: new Thing({
          id: "nice",
          label: "great",
          kids: [{ label: "wow" }],
        }),
      };

      expect(state.cool.kids[0].parent?.id).toEqual(state.cool.id);
      const displayData = parse(state);
      expect(displayData.length).toEqual(1);
    });

    it("understands nested objects", () => {
      const json = {
        cool: {
          great: {
            wow: "amazing",
          },
        },
      };

      const displayData = parse(json);

      expect(displayData[0].key).toEqual("cool");
      expect(displayData[0].path).toEqual("cool");
      expect(displayData[0].type).toEqual("object");
      expect(displayData[0].value).toEqual({ great: { wow: "amazing" } });

      expect(displayData[0].kids[0].key).toEqual("great");
      expect(displayData[0].kids[0].path).toEqual("cool.great");
      expect(displayData[0].kids[0].type).toEqual("object");

      expect(displayData[0].kids[0].kids[0].key).toEqual("wow");
      expect(displayData[0].kids[0].kids[0].path).toEqual("cool.great.wow");
      expect(displayData[0].kids[0].kids[0].type).toEqual("string");
      expect(displayData[0].kids[0].kids[0].value).toEqual("amazing");
    });
  });

  describe(".patch", () => {
    it("can patch a primitive by path", () => {
      const json = {
        cool: {
          nice: 10,
        },
      };

      const displayData = parse(json);

      const nice = displayData[0].kids[0];

      patch(json, nice.path, 20);

      expect(json.cool.nice).toEqual(20);
    });
  });

  describe(".query", () => {
    it("works for exact match on simple object", () => {
      const subject = {
        name: "Jane",
        age: 30,
      };

      const entries = parse(subject);
      expect(entries.length).toEqual(2);

      const results = query(entries, "name").matches;
      expect(results.length).toEqual(1);
      expect(results[0]).toEqual("name");
    });

    it("works for deep match", () => {
      const subject = {
        name: "Jane",
        age: 30,
        pets: [
          { name: "Fluffy", type: "cat" },
          { name: "Spot", type: "dog" },
        ],
      };

      const entries = parse(subject);
      // pet name
      const results = query(entries, "pena").matches;
      expect(results.length).toEqual(2);

      expect(results[0]).toEqual("pets.0.name");
      expect(results[1]).toEqual("pets.1.name");
    });

    it("includes containing paths", () => {
      const subject = {
        name: "Jane",
        age: 30,
        pets: [
          {
            name: "Fluffy",
            type: "cat",
            fur: {
              color: "white",
              sheds: false,
            },
          },
          {
            name: "Spot",
            type: "dog",
            fur: {
              color: "red",
              sheds: true,
            },
          },
        ],
      };

      const entries = parse(subject);
      // pet fur sheds
      const { matches, parents } = query(entries, "pefush");

      expect(matches.length).toEqual(2);
      expect(matches[0]).toEqual("pets.0.fur.sheds");
      expect(matches[1]).toEqual("pets.1.fur.sheds");

      const parentPaths = parents;
      expect(parentPaths).toContain("pets");
      expect(parentPaths).toContain("pets.0");
      expect(parentPaths).toContain("pets.0.fur");
      expect(parentPaths).toContain("pets.1");
      expect(parentPaths).toContain("pets.1.fur");
    });
  });
});
