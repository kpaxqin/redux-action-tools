
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


export {
  createAction
}