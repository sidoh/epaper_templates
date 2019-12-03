import { useReducer, useCallback } from "react";

export const REDO = "redo";
export const UNDO = "undo";
export const UPDATE = "update";
export const SET = "set";
export const MARK_FOR_COLLAPSE = "mark_for_collapse";
export const COLLAPSE = "collapse";
export const CLEAR_HISTORY = "clear_history";
export const MARK_SAVED = "mark_saved";

const CollapseState = Object.freeze({
  not_collapsing: 0 ,
  start_collapse: 1,
  collapsing: 2
});

function mapReducer(reducer = x => x) {
  return function(state, action) {
    const { map } = state;

    switch (action.type) {
      case UPDATE:
        const { key, value } = action.payload;

        if (map[key] != value) {
          return {
            ...state,
            map: { ...map, [key]: value }
          };
        } else {
          return state;
        }

      case SET:
        return { ...state, map: action.payload };

      default:
        return reducer(present);
    }
  };
}

function listReducer(reducer = x => x) {
  return function(state, action) {
    const { list } = state;

    switch (action.type) {
      case UPDATE:
        const { index, value } = action.payload;

        if (list[index] != value) {
          const copy = list.slice();
          copy[index] = value;

          return { ...state, list: copy };
        } else {
          return state;
        }

      case SET:
        return { ...state, list: [...action.payload] };

      default:
        return reducer(present);
    }
  };
}

export function useUndoableList() {
  const { state, dispatch, ...rest } = useUndoableReducer(listReducer(), {
    list: []
  });

  const list = state.list;

  const updateAt = useCallback((index, value) => {
    dispatch({ type: UPDATE, payload: { index, value } });
  }, []);

  return [list, { ...rest, updateAt }];
}

export function useUndoableMap() {
  const { state, dispatch, ...rest } = useUndoableReducer(mapReducer(), {
    map: {}
  });

  const map = state.map;
  const updateAt = useCallback((key, value) => {
    dispatch({ type: UPDATE, payload: { key, value } });
  }, []);

  return [map, { ...rest, updateAt }];
}

export function useUndoableReducer(reducer, initialPresent) {
  const initialState = {
    history: [initialPresent],
    currentIndex: 0,
    collapseState: CollapseState.not_collapsing,
    saved: true
  };

  const [state, dispatch] = useReducer(undoable(reducer), initialState);

  const { saved, history, currentIndex } = state;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const undo = useCallback(() => dispatch({ type: UNDO }), []);
  const redo = useCallback(() => dispatch({ type: REDO }), []);
  const set = useCallback(
    (value, meta = {}) => dispatch({ type: SET, payload: value, meta }),
    []
  );
  const markForCollapse = useCallback(
    () => dispatch({ type: MARK_FOR_COLLAPSE }),
    []
  );
  const collapse = useCallback(() => dispatch({ type: COLLAPSE }), []);
  const clearHistory = useCallback(() => dispatch({ type: CLEAR_HISTORY }), []);
  const markSaved = useCallback(() => dispatch({ type: MARK_SAVED }), []);

  return {
    state: history[currentIndex],
    dispatch,
    history,
    canUndo,
    canRedo,
    undo,
    redo,
    set,
    isSaved: saved,
    markForCollapse,
    collapse,
    clearHistory,
    markSaved
  };
}

function undoable(reducer) {
  // Return a reducer that handles undo and redo
  return function(state, action) {
    const { history, currentIndex, collapseState } = state;

    switch (action.type) {
      case MARK_FOR_COLLAPSE:
        return {
          ...state,
          saved: false,
          collapseState: CollapseState.start_collapse,
        };
      case COLLAPSE:
        return {
          ...state,
          collapseState: CollapseState.not_collapsing
        };
      case UNDO:
        if (currentIndex == 0) {
          return state;
        }

        return {
          ...state,
          saved: false,
          currentIndex: currentIndex - 1
        };
      case REDO:
        if (currentIndex+1 >= history.length) {
          return state;
        }

        return {
          ...state,
          saved: false,
          currentIndex: currentIndex + 1
        };
      case CLEAR_HISTORY:
        return {
          ...state,
          history: [history[currentIndex]],
          currentIndex: 0
        };
      case MARK_SAVED:
        return {
          ...state,
          saved: true
        };
      default:
        // Delegate handling the action to the passed reducer
        const { meta: { skipHistory = false } = {} } = action;
        const present = history[currentIndex];
        const newPresent = reducer(present, action);

        // Nothing's changed, don't update history
        if (present === newPresent) {
          return state;
        }

        if (skipHistory || collapseState !== CollapseState.not_collapsing) {
          const newHistory = history.slice(0, currentIndex+1);

          if (skipHistory || collapseState === CollapseState.collapsing) {
            newHistory[currentIndex] = newPresent;
          } else {
            newHistory.push(newPresent);
          }

          return {
            ...state,
            history: newHistory,
            currentIndex: newHistory.length-1,
            collapseState: CollapseState.collapsing
          };
        } else {
          const newIndex = currentIndex + 1;
          const newHistory = history.slice(0, newIndex);

          return {
            ...state,
            saved: false,
            history: [...newHistory, newPresent],
            currentIndex: newIndex
          };
        }
    }
  };
}
