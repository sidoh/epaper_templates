import React from "react";
import globalHook from "use-global-hook";
import api from "../util/api";
import produce from "immer";
import simpleHash from "../util/hash";
import { groupBy } from "../util/mungers";

const initialState = {
  variables: {},
  settings: {},
  screenMetadata: {},
  bitmaps: {},
  cachedBitmaps: {}
};

function createLoadFunction(apiPath, stateVariable, fn = x => x) {
  return store => {
    if (store.state[stateVariable] !== initialState[stateVariable]) {
      return Promise.resolve(store.state[stateVariable]);
    } else {
      return api.get(apiPath).then(x => {
        const value = fn(x.data);
        const newState = {
          ...store.state,
          [stateVariable]: value
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
    groupBy(x, v => v.name, { unique: true })
  ),

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
        return Promise.resolve(cachedFile.data);
      } else {
        return api
          .get(`/bitmaps/${file}`, { responseType: "arraybuffer" })
          .then(x => {
            const hash = simpleHash(new Uint8Array(x.data));

            const newState = produce(store.state, draft => {
              if (!store.state.cachedBitmaps[filename]) {
                draft.cachedBitmaps[filename] = {
                  data: x.data,
                  hash
                };
              } else {
                Object.assign(draft.cachedBitmaps[filename], {
                  data: x.data,
                  hash
                });
              }
            });
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

const useGlobalState = globalHook(React, initialState, actions);

export { useGlobalState };
export default useGlobalState;
