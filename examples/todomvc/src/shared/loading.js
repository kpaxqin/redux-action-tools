import _ from 'lodash'
import { ASYNC_PHASES } from 'redux-action-tools'

const actionTypes = {
  ASYNC_STARTED: 'ASYNC_STARTED',
  ASYNC_ENDED: 'ASYNC_ENDED',
};

export function loadingReducer(state = false, action) {
  switch (action.type) {
    case actionTypes.ASYNC_STARTED:
      return true;
    case actionTypes.ASYNC_ENDED:
      return false;
    default: return state;
  }
}

export default function loadingMiddleWare({ dispatch }) {
  return next => (action) => {
    const asyncPhase = _.get(action, 'meta.asyncPhase');
    const omitLoading = _.get(action, 'meta.omitLoading');

    if (asyncPhase && !omitLoading) {
      dispatch({
        type: asyncPhase === ASYNC_PHASES.START
          ? actionTypes.ASYNC_STARTED
          : actionTypes.ASYNC_ENDED,
        payload: {
          source: 'ACTION',
          action,
        },
      });
    }

    return next(action);
  };
}
