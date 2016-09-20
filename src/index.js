import camelCase from 'camelcase';

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
  return (...args) => {
    const action = {
      type
    };

    if (args[0] !== undefined && args[0] !== null) {
      action.payload = args[0] instanceof Error
        ? args[0]
        : finalActionCreator(...args);
    }

    if (action.payload instanceof Error) {
      action.error = true;
    }

    if (typeof metaCreator === 'function') {
      action.meta = metaCreator(...args);
    }

    return action;
  };
}

function createActions(actionConfigs) {
  const actions = {};
  for (let type in actionConfigs) { //use for-in instead of reduce
    if (Object.prototype.hasOwnProperty.call(actionConfigs, type)) {
      const config = actionConfigs[type];
      const actionName = camelCase(type);

      if (typeof config === 'function') {
        actions[actionName] = createAction(type, config);
      } else {
        const { payload, meta } = config || {};
        actions[actionName] = createAction(type, payload, meta)
      }
    }
  }
  return actions;
}

function getAsyncMeta(metaCreator, payload, asyncPhase) {
  const asyncMetaCreator = typeof metaCreator === 'function'
    ? metaCreator
    : (payload, defaultMeta) => ({...defaultMeta, ...metaCreator});

  return asyncMetaCreator(payload, {asyncPhase});
}

function createAsyncAction(type, payloadCreator, metaCreator) {
  const startAction = createAction(type, identity, (_, meta) => meta);
  const completeAction = createAction(`${type}_${ASYNC_PHASES.COMPLETED}`, identity, (_, meta) => meta);
  const failedAction = createAction(`${type}_${ASYNC_PHASES.FAILED}`, identity, (_, meta) => meta);

  return initPayload => {
    return (dispatch, getState) => {
      dispatch(
        startAction(initPayload, getAsyncMeta(metaCreator, initPayload, ASYNC_PHASES.START))
      );

      const promise = payloadCreator(initPayload, dispatch, getState);

      if (promise && typeof promise.then === 'function') {
        promise.then(value => {
          dispatch(
            completeAction(value, getAsyncMeta(metaCreator, value, ASYNC_PHASES.COMPLETED))
          );
        }, e => {
          dispatch(
            failedAction(e, getAsyncMeta(metaCreator, e, ASYNC_PHASES.FAILED))
          );
        });
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
      actionType.forEach((type) => {
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
      const handler = action ? this.handlers[action.type] : undefined;

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

function createReducer() {
  return new ActionHandler();
}

export {
  createAction,
  createActions,
  createAsyncAction,
  createReducer,
  ASYNC_PHASES
}