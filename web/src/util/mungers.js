const deepmerge = require('deepmerge');

export function drillMerge(object, path, newValue) {
  return drillModify(object, path, obj => ({ ...obj, ...newValue }));
}

export function drillModify(object, path, fn) {
  if (path.length === 0) {
    return fn(object);
  }

  const head = path[0];
  const rest = path.slice(1);

  if (Array.isArray(object)) {
    const updated = [...object];
    updated[head] = drillModify(object[head], rest, fn);
    return updated;
  } else {
    return {
      ...object,
      [head]: drillModify(object[head] || {}, rest, fn)
    };
  }
}

export function drillUpdate(object, path, fn) {
  if (path.length === 0) {
    return fn(object);
  }

  const head = path[0];
  const rest = path.slice(1);

  return drillUpdate(object[head], rest, fn);
}

export function drillExtract(object, path) {
  return path.reduce((a, x) => a[x] || {}, object);
}

function _drillFilter(object, path) {
  if (path.length === 0) {
    return object;
  } else {
    const [key, ...rest] = path;
    const result = _drillFilter(object[key], rest);

    if (Array.isArray(object)) {
      return [result]
    } else {
      return {[key]: result};
    }
  }
}

export function drillFilter(object, paths) {
  const filtered = paths.map(x => _drillFilter(object, x))
  return deepmerge.all(filtered);
}

export function deepClearFields(object, options = {}) {
  const { value = "" } = options;

  if (object instanceof Object) {
    return Object.fromEntries(
      Object.entries(object).map(([k, v]) => [k, deepClearFields(v, options)])
    );
  } else {
    return value;
  }
}

function _deepClearNonMatching(o1, o2) {
  if (!o1 || !o2 || typeof o1 !== "object" || typeof o2 !== "object") {
    return null;
  }

  const keyUnion = [...new Set([...Object.keys(o1), ...Object.keys(o2)])];

  const commonFields = keyUnion
    .map(k => {
      if (o1[k] === o2[k]) {
        return [k, o1[k]];
      } else if (typeof o1[k] === "object" && typeof o2[k] === "object") {
        return [k, _deepClearNonMatching(o1[k], o2[k])];
      } else {
        return null;
      }
    })
    .filter(x => x != null && x[1] != null);

  if (commonFields.length > 0) {
    return Object.fromEntries(commonFields);
  } else {
    return null;
  }
}

export function deepClearNonMatching(os) {
  if (os.length == 0) {
    return null;
  } else if (os.length == 1) {
    return os[0];
  } else {
    const [a, ...rest] = os;
    return _deepClearNonMatching(a, deepClearNonMatching(rest));
  }
}

export function deepPatch(target, patch) {
  if (!target) {
    return;
  }

  Object.entries(patch).forEach(([k, v]) => {
    if (
      v &&
      target[k] &&
      !Array.isArray(v) &&
      typeof v === "object" &&
      typeof target[k] === "object"
    ) {
      deepPatch(target[k], v);
    } else {
      target[k] = v;
    }
  });

  return target;
}

export const arrayGroupReducer = (a, x) => {
  if (a) {
    a.push(x);
    return a;
  } else {
    return [x];
  }
};

export const lastValueGroupReducer = (a, x) => {
  return x;
};

export const setGroupReducer = (a, x) => {
  if (a) {
    a.add(x);
    return a;
  } else {
    return new Set([x]);
  }
};

export function groupBy(
  o,
  fn,
  { valueFn = x => x, groupReducer = arrayGroupReducer } = {}
) {
  return o.reduce((a, x) => {
    const key = fn(x);
    const value = valueFn(x);
    a[key] = groupReducer(a[key], value);

    return a;
  }, {});
}
