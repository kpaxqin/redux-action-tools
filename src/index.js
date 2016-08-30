const ASYNC_PHASES = {
  START: 'START',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

const identity = id => id;

function createAction (type, payloadCreator, metaCreator) {
  const finalActionCreator = typeof payloadCreator === 'function'
    ? payloadCreator
    : identity;
  return (payload, meta) => {
    const action = {
      type
    };

    const isError = payload instanceof Error;

    if (payload !== undefined && payload !== null) {
      action.payload = isError ? payload : finalActionCreator(payload);
    }

    if (isError) {
      action.error = true;
    }

    if (metaCreator) {
      action.meta = typeof metaCreator === 'function'
        ? metaCreator(payload, meta)
        : meta;
    }

    return action;
  };
}

function createActions(actionConfigs) {
  const actions = {};
  for (let key in actionConfigs) {
    if (Object.prototype.hasOwnProperty.call(actionConfigs, key)) {
      const config = actionConfigs[key];
      actions[key] = createAction(key, config.payload, config.meta)
    }
  }
  return actions;
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

function ActionHandler() {
  this.currentAction = undefined;
  this.handlers = {};
}

ActionHandler.prototype = {
  when(actionType, handler) {
    if (Array.isArray(actionType)) {
      this.currentAction = undefined;
      Array.forEach((index, type) => {
        this.handlers[type] = handler;
      })
    } else {
      this.currentAction = actionType;
      this.handlers[actionType] = handler;
    }
    return this;
  },
  done(handler) {
    this._guardDoneAndFailed();
    this.handlers[`${this.currentAction}_${ASYNC_PHASES.COMPLETED}`] = handler;
    return this;
  },
  failed(handler) {
    this._guardDoneAndFailed();
    this.handlers[`${this.currentAction}_${ASYNC_PHASES.FAILED}`] = handler;
    return this;
  },
  build(initValue = null) {
    return (state = initValue, action) => {
      const handler = this.handlers[action.type];

      if (typeof handler === 'function') {
        return handler(state, action);
      }

      return state;
    };
  },
  _guardDoneAndFailed() {
    if (!this.currentAction) {
      throw new Error(
        'Method "done" & "failed" must follow the "when(action, ?handler)", and "action" should not be an array'
      );
    }
  }
};

function getReducerForActions() {
  return new ActionHandler();
}

export {
  createAction,
  createActions,
  createAsyncAction,
  getReducerForActions
}