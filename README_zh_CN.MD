# redux-action-tools

轻量级、全面兼容异步处理的action工具。

本项目受`redux-actions`与`redux-promise-thunk`的启发。

## 下载
`npm i redux-action-tools`

## 使用

### createAction(actionName, payloadCreator [, metaCreator])

与`redux-actions`的[createAction](https://github.com/acdlite/redux-actions#createactiontype-payloadcreator--identity-metacreator)完全相同。
本项目单独实现只是为了减少不必要的依赖和体积。

### createAsyncAction(actionName, promiseCreator [, metaCreator])

**此方法依赖redux-thunk中间件才能正常工作**.

The `createAction` will return an action creator which creates pain action object, while this function will return a action creator for `thunk`
`createAction`方法本质上返回了一个创建纯action对象的action creator方法。
而为了处理异步，`createAsyncAction`返回的是一个创建**thunk**的action creator。借助`redux-thunk`对thunk的处理以实现异步。

第二个参数promiseCreator要求你传入一个返回promise对象的方法。使用promise表达异步逻辑是规范、易用的，并且很容易和async/await函数兼容。

看下面的例子:

```js
//editTodo方法是一个返回thunk的action creator, 注意promiseCreator只能接受一个参数
const editTodo = createPromiseThunk('EDIT_TODO', function(todo) {
  return todoApi.edit(todo); //todoApi.edit() should return a Promise object;
});

//TodoItem.jsx

class TodoItem extends Component {
  //...
  handleEdit(todo) {
    dispatch(editTodo(todo));//调用action creator的参数(只能是一个)会传给promiseCreator
  }
  //...
}
```

在整个过程中，如下三个action可能会被触发:

|     type           | When         |  payload  | meta.asyncPhase    |
| --------           |  -----      | :----:    | :----:  |
| `${actionName}` | promiseCreator调用之前 | promiseCreator的第一个参数 | 'START' |
| `${actionName}_COMPLETED` | promise resolved | value of promise | 'COMPLETED' |
| `${actionName}_FAILED` | promise rejected | reason of promise | 'FAILED' |

上表中第一个action是同步的且一定会被触发。第二三个分别对应promise的成功与失败。

社区中有一些方案是完全使用meta代表异步action的不同阶段。然而个人认为不同的action应该由type区分，meta只应对action做元数据级的描述。
这种基于type的区分不仅更加清晰，也更加接近redux的启蒙——Elm中的做法。

#### 乐观更新
由于第一个action是同步的，所以实现乐观更新非常容易，这是本项目相对于`redux-promise`的优点。

#### meta.asyncPhase 与中间件拦截
本项目使用meta.asyncPhase来表示不同的异步阶段。
配合中间件针对meta.asyncPhase属性做拦截，可以轻松实现异步请求的全局Loading显示与通用异常处理：

```js
import _ from 'lodash'
import { ASYNC_PHASES } from 'redux-action-tools'

function loadingMiddleWare({dispatch}) {
  return next => action => {
    const asyncStep = _.get(action, 'meta.asyncStep');
    const omitLoading = _.get(action, 'meta.omitLoading');
    
    if (omitLoading) return;
    
    if (asyncStep === ASYNC_PHASES.START) {
      dispatch({ // This action will enable the loading spinner
        type: 'ASYNC_STARTED',
        payload: {
          action
        }
      })
    } else if (asyncStep === ASYNC_PHASES.COMPLETED || asyncStep === ASYNC_PHASES.FAILED) {
      dispatch({ // This action will disable the loading spinner
        type: 'ASYNC_ENDED',
        payload: {
          action
        }
      })
    }
    next(action);
  }
}

```

通过metaCreator你可以自定义meta对象，通知中间件绕过公共处理逻辑: 

```js
const requestWithoutLoadingSpinner = createAsyncAction(type, promiseCreator, (payload, defaultMeta) => {
  return { ...defaultMeta, omitLoading: true };
})
```


### createReducer

使用 *XXX_COMPLETED*, *XXX_FAILED* 来区分action虽然更加清晰，写起来却非常麻烦：
每个异步action你都需要写三个action type以及对应的reducer，这无疑会带来大量重复、无意义的工作，而这也是`createReducer`可以发挥作用的地方:


 ```js

 const handler = (state, action) => newState 

 const reducer = createReducer()
   .when([ACTION_FOO, ACTION_BAR], handlerForBothActions) // 多个action共用一个处理逻辑
   .when('BAZ', handler) // handler可用于实现乐观更新，你也可以不传这个handler
   .done(handler) // 处理 'BAZ_COMPLETED'
   .failed(errorHandler) // 处理 'BAZ_FAILED'
   .build(initValue); // 不要忘了调用build函数! 初始值是可选的，但强烈建议你提供初始值
 ```

 The `done` and `failed` method can only follow with `when(action)`, so examples below are INVALID and will throw an error:
上述写法既避免了`switch-case`语句，又对异步action的处理提供了一致的抽象：
上例中你只需要声明"BAZ"这一个action即可，**没有多余的字符串与action**

唯一需要注意的，是`.done`与`.failed`的使用是有限制的——他们必须知道自己属于哪个action。

下面两个例子都会抛出异常：

 ```js

 reducer = createReducer()
   .done(handler) // throw error here, cuz we don't know which action to handle
   .build()

 reducer = createReducer()
   .when([A, B])
   .done(handler) // throw error here, same reason since we don't know which one you mean

 ```


