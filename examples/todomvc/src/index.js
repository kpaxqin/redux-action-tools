import React from 'react'
import { render } from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import thunk from 'redux-thunk'
import logger from 'redux-logger'
import App from './containers/App'
import reducer from './reducers'
import loadingMiddleware from './shared/loading'
import 'todomvc-app-css/index.css'

const store = createStore(
  reducer, 
  applyMiddleware(
    loadingMiddleware,
    thunk, 
    logger,
  )
)

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
