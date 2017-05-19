import { combineReducers } from 'redux'
import todos from './todos'
import {loadingReducer} from '../shared/loading'

const rootReducer = combineReducers({
  todos,
  loading: loadingReducer
})

export default rootReducer
