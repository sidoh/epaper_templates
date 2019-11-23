import React from "react";
import globalHook from "use-global-hook";
import api from "../util/api";

function createLoadFunction(apiPath, stateVariable) {
  return store => {
    return api.get(apiPath).then(x => {
      const newState = {
        ...store.state,
        [stateVariable]: x.data
      };
      store.setState(newState);
      return x.data;
    });
  };
}

const initialState = {
  variables: {},
  settings: {},
  screenMetadata: {},
  bitmaps: {}
};

const actions = {
  loadVariables: createLoadFunction("/variables", "variables"),
  loadScreenMetadata: createLoadFunction("/screens", "screenMetadata"),
  loadSettings: createLoadFunction("/settings", "settings"),

  loadBitmap: (store, filename) => {
    const file = filename.split("/").slice(-1)[0];
    return api
      .get(`/bitmaps/${file}`, { responseType: "arraybuffer" })
      .then(x => {
        const newState = {
          ...store.state,
          bitmaps: {
            ...store.state.bitmaps,
            [filename]: x.data
          }
        };
        store.setState(newState);
        return x.data;
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
