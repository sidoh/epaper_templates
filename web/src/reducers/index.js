export const settings = (state = {}, action) => {
  console.log(state);
  if (action.type == 'UPDATE_SETTING') {
    return Object.assign({}, state, {[action.key]: action.value});
  }
  return state;
}