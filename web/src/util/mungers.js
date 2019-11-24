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
  return path.reduce((a, x) => a[x], object);
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

  const commonFields = Object.entries(o1)
    .map(([k, v]) => {
      if (v === o2[k]) {
        return [k, v];
      } else if (typeof o1 === typeof o2) {
        return [k, _deepClearNonMatching(v, o2[k])];
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
  Object.entries(patch).forEach(([k, v]) => {
    if (v && typeof v === "object" && typeof target[k] === "object") {
      deepPatch(target[k], v);
    } else {
      target[k] = v;
    }
  });

  return target;
}

export function groupBy(o, fn) {
  return o.reduce((a, x) => {
    const key = fn(x);
    if (a[key]) {
      a[key].push(x);
    } else {
      a[key] = [x];
    }
    return a;
  }, {});
}
