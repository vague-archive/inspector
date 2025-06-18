import { describe, expect, it } from "vitest";
import { getMatchParts } from "../src/models/filter";

describe("filter", () => {
  describe('matchParts',() => {
    it('matches full string', () => {
      const parts = getMatchParts('nice', 'nice')
      expect(parts.length).toEqual(1);
      expect(parts[0].isMatch).toEqual(true);
      expect(parts[0].string).toEqual('nice');
    })

    it('matches partial string', () => {
      const parts = getMatchParts('nice', 'nicer')
      expect(parts.length).toEqual(2);
      expect(parts[0].isMatch).toEqual(true);
      expect(parts[0].string).toEqual('nice');
      expect(parts[1].isMatch).toEqual(false);
      expect(parts[1].string).toEqual('r');
    })

    it('matches partial string', () => {
      const parts = getMatchParts('nice', 'nicer')
      expect(parts.length).toEqual(2);
      expect(parts[0].isMatch).toEqual(true);
      expect(parts[0].string).toEqual('nice');
      expect(parts[1].isMatch).toEqual(false);
      expect(parts[1].string).toEqual('r');
    })

    it('matches when start of query is not in key', () => {
      const parts = getMatchParts('ice', 'nice')
      expect(parts.length).toEqual(2);
      expect(parts[0].isMatch).toEqual(false);
      expect(parts[0].string).toEqual('n');
      expect(parts[1].isMatch).toEqual(true);
      expect(parts[1].string).toEqual('ice');
    })

    it('matches case insensitive', () => {
      const parts = getMatchParts('nice', 'NiCe')
      expect(parts[0].isMatch).toEqual(true);
      expect(parts[0].string).toEqual('NiCe');
      expect(parts.length).toEqual(1);
    })

    it('returns no match when no match', () => {
      const parts = getMatchParts('nice', 'bad')
      expect(parts.length).toEqual(1);
      expect(parts[0].isMatch).toEqual(false);
      expect(parts[0].string).toEqual('bad');
    })

    it('ignores characters in paths', () => {
      const parts = getMatchParts('nice', 'ice', 'n.i.c.ice')
      expect(parts[0].isMatch).toEqual(false);
      expect(parts[0].string).toEqual('ic');
      expect(parts[1].isMatch).toEqual(true);
      expect(parts[1].string).toEqual('e');

      expect(parts.length).toEqual(2);
    })

    it('matches repeated characters when path is ignored', () => {
      const parts = getMatchParts('paddlea', 'meta', 'paddles.0.meta')
      expect(parts[0].isMatch).toEqual(false);
      expect(parts[0].string).toEqual('met');
      expect(parts[1].isMatch).toEqual(true);
      expect(parts[1].string).toEqual('a');
      expect(parts.length).toEqual(2);
    })
  })
});