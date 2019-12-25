import React from "react";
import globalHook from "use-global-hook";
import { fromByteArray, toByteArray } from "base64-js";
import api from "../util/api";
import produce from "immer";
import simpleHash from "../util/hash";
import { groupBy, lastValueGroupReducer } from "../util/mungers";

const initialState = {
  variables: {},
  settings: {},
  screenMetadata: {},
  bitmaps: {},
  cachedBitmaps: {},
  errors: [],
  loadedPages: {},
};

function createLoadFunction(apiPath, stateVariable, fn = x => x) {
  return (store, {forceReload = false} = {}) => {
    if (!forceReload && store.state[stateVariable] !== initialState[stateVariable]) {
      return Promise.resolve(store.state[stateVariable]);
    } else {
      return api.get(apiPath).then(x => {
        const value = fn(x.data);
        const newState = {
          ...store.state,
          [stateVariable]: value,
          loadedPages: {
            ...store.state.loadedPages,
            [stateVariable]: true
          }
        };
        store.setState(newState);
        return value;
      });
    }
  };
}

const actions = {
  loadVariables: createLoadFunction("/variables", "variables"),
  loadScreenMetadata: createLoadFunction("/screens", "screenMetadata"),
  loadSettings: createLoadFunction("/settings", "settings"),
  loadBitmaps: createLoadFunction("/bitmaps", "bitmaps", x =>
    groupBy(x, v => v.name, { groupReducer: lastValueGroupReducer })
  ),
  addError: (store, error) => {
    const updated = produce(store.state, draft => {
      draft.errors.push(error);
    });
    store.setState(updated);
  },
  dismissError: (store, index) => {
    const updated = produce(store.state, draft => {
      draft.errors.splice(index, 1);
    });
    store.setState(updated);
  },

  loadBitmap: (store, filename) => {
    const file = filename.split("/").slice(-1)[0];
    const { [filename]: cachedFile } = store.state.cachedBitmaps;

    return actions.loadBitmaps(store).then(bitmaps => {
      if (
        cachedFile &&
        cachedFile.data &&
        bitmaps[filename] &&
        bitmaps[filename].metadata &&
        bitmaps[filename].metadata.hash === cachedFile.hash
      ) {
        return Promise.resolve(toByteArray(cachedFile.data));
      } else {
        return api
          .get(`/bitmaps/${file}`, { responseType: "arraybuffer" })
          .then(x => {
            const data = new Uint8Array(x.data);
            const hash = simpleHash(data);

            const newState = produce(store.state, draft => {
              if (!store.state.cachedBitmaps[filename]) {
                draft.cachedBitmaps[filename] = {
                  data: fromByteArray(data),
                  hash
                };
              } else {
                Object.assign(draft.cachedBitmaps[filename], {
                  data: fromByteArray(data),
                  hash
                });
              }
            });
            localStorage.setItem(
              "bitmap_cache",
              JSON.stringify(newState.cachedBitmaps)
            );
            store.setState(newState);

            return x.data;
          });
      }
    });
  },

  loadInitialState: store => {
    const promises = [
      "loadSettings",
      "loadVariables",
      "loadScreenMetadata"
    ].map(x => actions[x](store));

    return Promise.all(promises);
  }
};

const loadInitialState = () => {
  try {
    return {
      ...initialState,
      cachedBitmaps: JSON.parse(localStorage.getItem("bitmap_cache")) || {}
    };
  } catch (error) {
    console.warn("Error loading cached state from localStorage", error);
    return initialState;
  }
};

const useGlobalState = globalHook(React, loadInitialState(), actions);

export { useGlobalState };
export default useGlobalState;
