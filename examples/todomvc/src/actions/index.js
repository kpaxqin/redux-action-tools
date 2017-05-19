import * as types from '../constants/ActionTypes'
import {createAsyncAction} from 'redux-action-tools'

// return a Promise maybe (70%) fulfilled 1 second later
const maybe = (data)=> (new Promise(function(resolve, reject) {
  setTimeout(()=> {
    Math.random() > 0.3 ? resolve(data) : reject(new Error('Ops, async operation failed'));
  }, 1000)
}))

export const addTodo = createAsyncAction(types.ADD_TODO, text=> maybe({text}));

// The metaCreator can be either an object or a function which presents: (payload, defaultMeta) => finalMeta.
// When you provide an object, it will be merged with defaultMeta, equalize to (payload, defaultMeta) => ({...defaultMeta, ...yourObj})
export const deleteTodo = createAsyncAction(types.DELETE_TODO, id=> maybe({id}), { omitLoading: true })

// export const addTodo = text => ({ type: types.ADD_TODO, text })
// export const deleteTodo = id => ({ type: types.DELETE_TODO, payload: {id} })
export const editTodo = (id, text) => ({ type: types.EDIT_TODO, payload: {id, text} })
export const completeTodo = id => ({ type: types.COMPLETE_TODO, payload: {id} })
export const completeAll = () => ({ type: types.COMPLETE_ALL })
export const clearCompleted = () => ({ type: types.CLEAR_COMPLETED })
