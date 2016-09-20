# redux-action-tools

[![Build Status](https://travis-ci.org/kpaxqin/redux-action-tools.svg?branch=master)](https://travis-ci.org/kpaxqin/redux-action-tools)
[![Coverage Status](https://coveralls.io/repos/github/kpaxqin/redux-action-tools/badge.svg?branch=master)](https://coveralls.io/github/kpaxqin/redux-action-tools?branch=master)

Light-weight action tools with async and optimistic update support.

> This project is inspired by `redux-actions` and `redux-promise-thunk`

[中文文档](https://github.com/kpaxqin/redux-action-tools/blob/master/README_zh_CN.MD)

## Install
`npm i redux-action-tools`

## Usage and APIs

### createAction(actionName, payloadCreator [, metaCreator])

Same as [createAction](https://github.com/acdlite/redux-actions#createactiontype-payloadcreator--identity-metacreator) in `redux-actions`, we write our own for less dependency and fix some defects.

### createAsyncAction(actionName, promiseCreator [, metaCreator])

**This function is relly on `redux-thunk`**.

The `createAction` returns an action creator for pain action object, While `createAsyncAction` will return an action creator for `thunk`.

#### promiseCreator(syncPayload, dispatch, getState)

*This function should return a promise object.*

The action creator returned by `createAsyncAction` receives one parameter -- the sync payload, we will dispatch a sync action same as `createAction`. And then, call the promiseCreator for the async behaviour, dispatch action for the result of it.

The `dispatch` and `getState` is the same as a normal thunk action, enables you to customize your async behaviour, even dispatch other actions.

Simple example below:

```js
const asyncAction = createAsyncAction('ASYNC', function (syncPayload, dispatch, getState) {
  const user = getState().user;

  return asyncApi(syncPayload, user)
    .then((result) => {
      dispatch(otherAction(result));

      return result; // don't forget to return a result.
    })
});

//In your component

class Foo extends Component {
  //...
  doAsync() {
    // You don't need dispatch here if you're using bindActionCreators
    dispatch(asyncAction(syncPayload));
  }
}
```

After you dispatch the async action, following flux standard action might been triggered:

|     type           | When         |  payload  | meta.asyncPhase    |
| --------           |  -----      | :----:    | :----:  |
| `${actionName}` | before promiseCreator been called | sync payload | 'START' |
| `${actionName}_COMPLETED` | promise resolved | value of promise | 'COMPLETED' |
| `${actionName}_FAILED` | promise rejected | reason of promise | 'FAILED' |


> Idea here is that we should use different type, rather than just meta, to identity different actions during an async process. This will be more clear and closer to what we do in`Elm`

#### Optimistic update

Since the first action will be triggered before async behaviour, its easy to support optimistic update.

#### meta.asyncPhase and middleware

We use `meta.asyncPhase` to identity different phases.
You can use it with middleware to handle features like global loading spinner or common error handler:

```js
import _ from 'lodash'
import { ASYNC_PHASES } from 'redux-action-tools'

function loadingMiddleWare({dispatch}) {
  return next => action => {
    const asyncStep = _.get(action, 'meta.asyncStep');
    const omitLoading = _.get(action, 'meta.omitLoading');

    if (!asyncStep || omitLoading) return;

    dispatch({
      type: asyncStep === ASYNC_PHASES.START ? 'ASYNC_STARTED' : 'ASYNC_ENDED',
      payload: {
        action
      }
    })

    next(action);
  }
}

```

And with metaCreator, you can change the meta object and skip the common process:

```js
const requestWithoutLoadingSpinner = createAsyncAction(type, promiseCreator, (payload, defaultMeta) => {
  return { ...defaultMeta, omitLoading: true };
})
```


### createReducer

But, writing things like *XXX_COMPLETED*, *XXX_FAILED* is awful !!

And this is why we build the `createReducer`!

 ```js

 const handler = (state, action) => newState

 const reducer = createReducer()
   .when([ACTION_FOO, ACTION_BAR], handlerForBothActions) // share handler for multi actions
   .when('BAZ', handler) // optimistic update here if you need
   .done(handler) // handle 'BAZ_COMPLETED'
   .failed(errorHandler) // handle 'BAZ_FAILED'
   .build(initValue); // Don't forget 'build()' !


 const reducer = createReducer()
   .when(FOO)     // no optimistic update here, just declare the parent action for .done & .failed
   .done(handler) //
   .build()
 ```

With `createReducer`, we can skip the switch-case statement which lots of people don't like it.
And more important, we provide a common and semantic way to handle the async behaviour.

However, there are some limitations you should know when you use `.done` and `.failed`:

 ```js

 reducer = createReducer()
   .done(handler) // throw error here, cuz we don't know which action to handle
   .build()

 reducer = createReducer()
   .when([A, B])
   .done(handler) // throw error here, same reason since we don't know which one you mean

 ```


