import { createReducer } from 'redux-action-tools'
import { ADD_TODO, DELETE_TODO, EDIT_TODO, COMPLETE_TODO, COMPLETE_ALL, CLEAR_COMPLETED } from '../constants/ActionTypes'

const initialState = [
  {
    text: 'Use Redux',
    completed: false,
    id: 0
  }
]

const reducer = createReducer()
  .when(ADD_TODO)
  .done((state, {payload: {text}}) => [
    {
      id: state.reduce((maxId, todo) => Math.max(todo.id, maxId), -1) + 1,
      completed: false,
      text
    },
    ...state
  ])
  .when(DELETE_TODO)
  .done((state, {payload})=> state.filter(todo =>
    todo.id !== payload.id
  ))
  .when(EDIT_TODO, (state, {payload})=> state.map(todo =>
    todo.id === payload.id ?
      { ...todo, text: payload.text } :
      todo
  ))
  .when(COMPLETE_TODO, (state, {payload})=> state.map(todo =>
    todo.id === payload.id ?
      { ...todo, completed: !todo.completed } :
      todo
  ))
  .when(COMPLETE_ALL, (state)=> {
    const areAllMarked = state.every(todo => todo.completed)
    return state.map(todo => ({
      ...todo,
      completed: !areAllMarked
    }))
  })
  .when(CLEAR_COMPLETED, (state)=> state.filter(todo => todo.completed === false))
  .build(initialState);

export default reducer;
