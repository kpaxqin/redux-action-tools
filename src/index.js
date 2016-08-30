const ASYNC_PHASES = {
  START: 'START',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const identity = id => id;

function createAction (type, payloadCreator, metaCreator) {
  return payload => {
    const action = {
      type,
      payload: typeof payloadCreator === 'function'
        ? payloadCreator(payload)
        : identity(payload)
    };

    if (payload instanceof Error) {
      action.error = true;
    }

    if (metaCreator) {
      action.meta = typeof metaCreator === 'function'
        ? metaCreator(payload)
        : metaCreator;
    }

    return action;
  };
}

function getAsyncMetaCreator(metaCreator) {
  return typeof metaCreator === 'function'
    ? metaCreator
    : (payload, asyncPhase) => ({asyncPhase, ...metaCreator});
}

function getAsyncMeta(metaCreator, payload, asyncPhase) {
  return getAsyncMetaCreator(metaCreator)(payload, asyncPhase);
}

function createAsyncAction(type, payloadCreator, metaCreator) {
  const startAction = createAction(type);
  const completeAction = createAction(`${type}_${ASYNC_PHASES.COMPLETED}`);
  const failedAction = createAction(`${type}_${ASYNC_PHASES.FAILED}`);

  return initPayload => {
    return dispatch => {
      dispatch(
        startAction(initPayload, getAsyncMeta(metaCreator, initPayload, ASYNC_PHASES.START))
      );

      const promise = payloadCreator(initPayload);

      if (promise && typeof promise.then === 'function') {
        promise.then(value => {
          dispatch(
            completeAction(value, getAsyncMeta(metaCreator, value, ASYNC_PHASES.COMPLETED))
          );
        }).catch(e => {
          dispatch(
            failedAction(e, getAsyncMeta(metaCreator, e, ASYNC_PHASES.FAILED))
          );
        })
      }
    }
  };
}


export {
  createAction,
  createAsyncAction
}