/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var ASYNC_PHASES = {
	  START: 'START',
	  COMPLETED: 'COMPLETED',
	  FAILED: 'FAILED'
	};

	var identity = function identity(id) {
	  return id;
	};

	function createAction(type, payloadCreator, metaCreator) {
	  return function (payload) {
	    var action = {
	      type: type,
	      payload: typeof payloadCreator === 'function' ? payloadCreator(payload) : identity(payload)
	    };

	    if (payload instanceof Error) {
	      action.error = true;
	    }

	    if (metaCreator) {
	      action.meta = typeof metaCreator === 'function' ? metaCreator(payload) : metaCreator;
	    }

	    return action;
	  };
	}

	function getAsyncMetaCreator(metaCreator) {
	  return typeof metaCreator === 'function' ? metaCreator : function (payload, asyncPhase) {
	    return _extends({ asyncPhase: asyncPhase }, metaCreator);
	  };
	}

	function getAsyncMeta(metaCreator, payload, asyncPhase) {
	  return getAsyncMetaCreator(metaCreator)(payload, asyncPhase);
	}

	function createAsyncAction(type, payloadCreator, metaCreator) {
	  var startAction = createAction(type);
	  var completeAction = createAction(type + '_' + ASYNC_PHASES.COMPLETED);
	  var failedAction = createAction(type + '_' + ASYNC_PHASES.FAILED);

	  return function (initPayload) {
	    return function (dispatch) {
	      dispatch(startAction(initPayload, getAsyncMeta(metaCreator, initPayload, ASYNC_PHASES.START)));

	      var promise = payloadCreator(initPayload);

	      if (promise && typeof promise.then === 'function') {
	        promise.then(function (value) {
	          dispatch(completeAction(value, getAsyncMeta(metaCreator, value, ASYNC_PHASES.COMPLETED)));
	        }).catch(function (e) {
	          dispatch(failedAction(e, getAsyncMeta(metaCreator, e, ASYNC_PHASES.FAILED)));
	        });
	      }
	    };
	  };
	}

	function ActionHandler() {
	  this.currentAction = undefined;
	  this.handlers = {};
	}

	ActionHandler.prototype = {
	  when: function when(actionType, handler) {
	    var _this = this;

	    if (Array.isArray(actionType)) {
	      this.currentAction = undefined;
	      Array.forEach(function (index, type) {
	        _this.handlers[type] = handler;
	      });
	    } else {
	      this.currentAction = actionType;
	      this.handlers[actionType] = handler;
	    }
	    return this;
	  },
	  done: function done(handler) {
	    this._guardDoneAndFailed();
	    this.handlers[this.currentAction + '_' + ASYNC_PHASES.COMPLETED] = handler;
	    return this;
	  },
	  failed: function failed(handler) {
	    this._guardDoneAndFailed();
	    this.handlers[this.currentAction + '_' + ASYNC_PHASES.FAILED] = handler;
	    return this;
	  },
	  build: function build() {
	    var _this2 = this;

	    var initValue = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

	    return function () {
	      var state = arguments.length <= 0 || arguments[0] === undefined ? initValue : arguments[0];
	      var action = arguments[1];

	      var handler = _this2.handlers[action.type];

	      if (typeof handler === 'function') {
	        return handler(state, action);
	      }

	      return state;
	    };
	  },
	  _guardDoneAndFailed: function _guardDoneAndFailed() {
	    if (!this.currentAction) {
	      throw new Error('Method "done" & "failed" must follow the "when(action, ?handler)", and "action" should not be an array');
	    }
	  }
	};

	function getReducerForActions() {
	  return new ActionHandler();
	}

	exports.createAction = createAction;
	exports.createAsyncAction = createAsyncAction;
	exports.getReducerForActions = getReducerForActions;

/***/ }
/******/ ]);