import { useReducer, useCallback } from "react";

export const REDO = "redo";
export const UNDO = "undo";
export const UPDATE = "update";
export const SET = "set";
export const MARK_FOR_COLLAPSE = "mark_for_collapse";
export const COLLAPSE = "collapse";

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
  const { state, dispatch, canUndo, canRedo } = useUndoableReducer(
    listReducer(),
    { list: [] }
  );

  const list = state.list;

  const updateAt = useCallback((index, value) => {
    dispatch({ type: UPDATE, payload: { index, value } });
  }, []);
  const undo = useCallback(() => dispatch({ type: UNDO }));
  const redo = useCallback(() => dispatch({ type: REDO }));
  const set = useCallback(value => dispatch({ type: SET, payload: value }));
  const markForCollapse = useCallback(() => dispatch({ type: MARK_FOR_COLLAPSE }));
  const collapse = useCallback(() => dispatch({ type: COLLAPSE }));

  return [list, { markForCollapse, collapse, set, updateAt, undo, redo, canUndo, canRedo }];
}

export function useUndoableReducer(reducer, initialPresent) {
  const initialState = {
    history: [initialPresent],
    currentIndex: 0,
    isCollapsing: false
  };

  const [state, dispatch] = useReducer(undoable(reducer), initialState);

  const { history, currentIndex } = state;

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return { state: history[currentIndex], dispatch, history, canUndo, canRedo };
}

function undoable(reducer) {
  // Return a reducer that handles undo and redo
  return function(state, action) {
    const { history, currentIndex, isCollapsing } = state;

    switch (action.type) {
      case MARK_FOR_COLLAPSE:
        return {
          ...state,
          isCollapsing: true,
          currentIndex: currentIndex + 1,
          history: [...history.slice(0, currentIndex+1), history[currentIndex]]
        };
      case COLLAPSE:
        return {
          ...state,
          isCollapsing: false
        };
      case UNDO:
        return {
          ...state,
          currentIndex: currentIndex - 1
        };
      case REDO:
        return {
          ...state,
          currentIndex: currentIndex + 1
        };
      default:
        // Delegate handling the action to the passed reducer
        const present = history[currentIndex];
        const newPresent = reducer(present, action);

        // Nothing's changed, don't update history
        if (present === newPresent) {
          return state;
        }

        if (isCollapsing) {
          const newHistory = history.slice();
          newHistory[currentIndex] = newPresent;
          return {
            ...state,
            history: newHistory
          };
        } else {
          const newIndex = currentIndex + 1;
          const newHistory = history.slice(0, newIndex);

          return {
            ...state,
            history: [...newHistory, newPresent],
            currentIndex: newIndex
          };
        }
    }
  };
}
