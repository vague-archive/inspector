import { ref } from "vue";

export const filter = ref({
  expanded: [] as string[],
  queryMatches: [] as string[],
  queryString: "",
});

export const treeQuery = ref("");

export function setMatches(matches: string[]) {
  filter.value.queryMatches = matches;
}

type QueryMatch = {
  isMatch: boolean;
  string: string;
};

export function getMatchParts(
  query: string,
  key: string,
  path?: string
): QueryMatch[] {
  let queryIndex = 0;
  let parts: QueryMatch[] = [];

  // ignore characters that match path leading to key
  if (path) {
    const startOfKey = path.lastIndexOf(".") + 1;
    let pathIndex = -1;
    const caseInsensitivePath = path.toLowerCase();

    while (true) {
      // find index of query character in path after the last path match
      pathIndex = caseInsensitivePath
        .substring(pathIndex + 1)
        .indexOf(query[queryIndex].toLowerCase());
      // if the query character is not in the path, there are no matches. break
      if (pathIndex < 0) {
        break;
      }
      // if the path index is before the start of the key, increment the query index
      if (pathIndex < startOfKey - pathIndex) {
        queryIndex++;
        // if the path index is after the start of the key, break and start matching
      } else {
        break;
      }

      // if we've reached the end of the query, there are no matches. return nothing
      if (queryIndex >= query.length) {
        return [{ isMatch: false, string: key }];
      }
    }
  }

  // since first matching character of query string may be in a parent,
  // start the query at the first character that matches this key
  while (key.toLowerCase().indexOf(query[queryIndex].toLowerCase()) < 0) {
    queryIndex++;
    if (queryIndex >= query.length) {
      return [{ isMatch: false, string: key }];
    }
  }

  for (let i = 0; i < key.length; i++) {
    if (queryIndex >= query.length) {
      parts.push({ isMatch: false, string: key.slice(i) });
      return parts;
    }
    const keyChar = key[i];
    const queryChar = query[queryIndex];

    // if the key character matches the query character, move to the next query character
    if (keyChar.toLowerCase() === queryChar.toLowerCase()) {
      queryIndex++;
      // if we're currently in a match, add the character to the current match
      if (parts[parts.length - 1]?.isMatch) {
        parts[parts.length - 1].string += keyChar;
        // otherwise, start a new match
      } else {
        parts.push({ isMatch: true, string: keyChar });
      }
    } else {
      // if we're not in a match, start a new non-match
      if (parts[parts.length - 1]?.isMatch === false) {
        parts[parts.length - 1].string += keyChar;
        // otherwise, add the character to the current non-match
      } else {
        parts.push({ isMatch: false, string: keyChar });
      }
    }
  }

  return parts;
}

export function toggle(path: string) {
  filter.value.expanded = filter.value.expanded.includes(path)
    ? filter.value.expanded.filter((p) => p !== path)
    : [...filter.value.expanded, path];

  saveExpanded();
}

export function saveExpanded() {
  localStorage.setItem("expanded", JSON.stringify(filter.value.expanded));
}

export function loadExpanded() {
  const expanded = localStorage.getItem("expanded");
  if (expanded) {
    filter.value.expanded = JSON.parse(expanded);
  }
}

export function isExpanded(path: string) {
  return filter.value.expanded.includes(path);
}
