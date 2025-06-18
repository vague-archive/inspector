export type JsType =
  | "string"
  | "thing"
  | "vector"
  | "number"
  | "object"
  | "array"
  | "boolean"
  | "bigint"
  | "symbol"
  | "null"
  | "function"
  | "undefined";

export type JsonEntry = {
  path: string;
  key: string;
  value: any;
  type: JsType;
  kids: JsonEntry[];
};

// sparse on comments but unit tested in jsonEditor.test.ts

export function patch(json: any, path: string, value: any) {
  const parts = path.split(".");
  let obj = json;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (obj[part] == null) {
      obj[part] = {};
    }
    obj = obj[part];
  }

  obj[parts[parts.length - 1]] = value;
}

export function get(json: any, path: string) {
  const parts = path.split(".");
  let obj = json;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (obj[part] == null) {
      return undefined;
    }
    obj = obj[part];
  }

  return obj;
}

export function query(entries: JsonEntry[], query: string) {
  const regex = queryRegexp(query);

  const results = {
    matches: new Set<string>(),
    parents: new Set<string>(),
  };

  recurseQuery(entries, regex, results);

  return {
    matches: Array.from(results.matches),
    parents: Array.from(results.parents),
  };
}

function recurseQuery(
  entries: JsonEntry[],
  query: RegExp,
  results: { matches: Set<string>; parents: Set<string> },
  parents: JsonEntry[] = []
) {
  for (const entry of entries) {
    if (entry.path.match(query)) {
      results.matches.add(entry.path);
      for (const parent of parents) {
        if (!results.parents.has(parent.path)) {
          results.parents.add(parent.path);
        }
      }
    }
    recurseQuery(entry.kids, query, results, parents.concat(entry));
  }
  return results;
}

export function parse(json: any) {
  const entries: JsonEntry[] = [];

  function parseObject(path: string, obj: any, entries: JsonEntry[] = []) {
    for (const key in obj) {
      const value = obj[key];
      if (key === "parent" && isThing(value)) {
        continue;
      }
      if (key === "kids" && isThing(value)) {
        continue;
      }
      if (
        typeof value === "object" &&
        value != null &&
        "querySelector" in value
      ) {
        continue;
      }
      const kids: JsonEntry[] = [];

      if (typeof value === "object") {
        parseObject(path ? `${path}.${key}` : key, value, kids);
      }

      const type =
        value === true || value === false
          ? "boolean"
          : value == null
          ? "null"
          : Array.isArray(value)
          ? "array"
          : isThing(value)
          ? "thing"
          : isVector(value)
          ? "vector"
          : typeof value;

      if (type === "function") {
        throw new Error(
          `ParseFunctionError: ${path}.${key} is a function which is not allowed in state`
        );
      }

      const localPath = path ? `${path}.${key}` : key;

      entries.push({
        path: localPath,
        key,
        value:
          type === "thing"
            ? value
            : type === "vector"
            ? [value.x, value.y]
            : value,
        kids,
        type,
      });
    }
  }

  parseObject("", json, entries);

  return entries;
}

function queryRegexp(query: string) {
  return new RegExp(query.split("").join(".*"), "i");
}

function isVector(value: any) {
  return (
    value.__serializedName?.startsWith("Vector") ||
    (value.x != null &&
      value.y != null &&
      Object.keys(value).length === 2 &&
      typeof value.x === "number" &&
      typeof value.y === "number")
  );
}

function isThing(value: any) {
  if (typeof value !== "object") {
    return false;
  }
  if (!value) {
    return false;
  }
  // anything with a transform is a thing
  return (
    value.id != null &&
    value.x != null &&
    value.y != null &&
    value.width != null &&
    value.height != null &&
    value.scale != null
  );
}
