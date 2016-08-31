# redux-action-tools

This lib is inspired by `redux-actions` and the `redux-promise-thunk`

## Install
`npm i redux-action-tools`

## Usage

### createAction(actionName, payloadCreator [, metaCreator])

The same as `createAction` in `redux-actions`;

### createAsyncAction(actionName, promiseCreator [, metaCreator])

**You will need to use `redux-thunk` as middleware to make this function work**.

The `createAction` will return an action creator which creates pain action object, while this function will return a action creator for `thunk`

And instead of payloadCreator, you need to pass a `promiseCreator` which returns a promise object.

See examples below:

```js
//editTodo is a thunk
const editTodo = createPromiseThunk('EDIT_TODO', function(todo) {
  return todoApi.edit(todo); //todoApi.edit() should return a Promise object;
});

//TodoItem.jsx
const {editTodo} = bindActionCreators(actions, dispatch);

class TodoItem extends Component {
  //...
  handleEdit(todo) {
    editTodo(todo);//only one parameter is allowed, and will be passed to promiseCreator;
  }
  //...
}
```

The thunk function will dispatch following flux standard actions(FSA) for the promise you returned in promiseCreator:

|     type           | When         |  payload  | meta.asyncPhase    |
| --------           |  -----      | :----:    | :----:  |
| `${actionName}` | before promiseCreator been called | first argument of promiseCreator | 'START' |
| `${actionName}_COMPLETED` | promise resolved | value of promise | 'COMPLETED' |
| `${actionName}_FAILED` | promise rejected | reason of promise | 'FAILED' |

The core idea here is the different action for completed or failed should have there own type, this make things more clear and closer to what we do in `Elm`.

With first action you can do optimistic update easily, and `meta.asyncPhase` enables you to intercept sync action or api failure in middleware, the example is WIP


 ### createReducer

Write 'XX_COMPLETED', 'XX_FAILED' in reducer is awful? Here comes `createReducer`!

This function is super easy just check example:

 ```js

 const handler = (state, action) => newState

 const reducer = createReducer()
   .when([ACTION_FOO, ACTION_BAR], handlerForBothActions)
   .when('BAZ', handler) // you can do optimistic update here, and it's ok to omit the handler if you want
   .done(handler) //handle 'BAZ_COMPLETED'
   .failed(errorHandler) //handle 'BAZ_FAILED'
   .build(initValue); // DON'T FORGET !
 ```

 The `done` and `failed` method can only follow with `when(action)`, so examples below are INVALID and will throw an error:

 ```js

 reducer = createReducer()
   .done(handler) // throw error here, cuz we don't know handle the success of which async action
   .build()

 reducer = createReducer()
   .when([A, B])
   .done(handler) // throw error here, same reason since we don't know which one you want

 ```


