(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["redux-action-tools"] = factory();
	else
		root["redux-action-tools"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
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
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ASYNC_PHASES = exports.createReducer = exports.createAsyncAction = exports.createActions = exports.createAction = undefined;

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	var _camelcase = __webpack_require__(2);

	var _camelcase2 = _interopRequireDefault(_camelcase);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var ASYNC_PHASES = {
	  START: 'START',
	  COMPLETED: 'COMPLETED',
	  FAILED: 'FAILED'
	};

	var identity = function identity(id) {
	  return id;
	};

	function createAction(type, payloadCreator, metaCreator) {
	  var finalActionCreator = typeof payloadCreator === 'function' ? payloadCreator : identity;
	  return function () {
	    var action = {
	      type: type
	    };

	    if ((arguments.length <= 0 ? undefined : arguments[0]) !== undefined && (arguments.length <= 0 ? undefined : arguments[0]) !== null) {
	      action.payload = (arguments.length <= 0 ? undefined : arguments[0]) instanceof Error ? arguments.length <= 0 ? undefined : arguments[0] : finalActionCreator.apply(undefined, arguments);
	    }

	    if (action.payload instanceof Error) {
	      action.error = true;
	    }

	    if (typeof metaCreator === 'function') {
	      action.meta = metaCreator.apply(undefined, arguments);
	    }

	    return action;
	  };
	}

	function createActions(actionConfigs) {
	  var actions = {};
	  for (var type in actionConfigs) {
	    //use for-in instead of reduce
	    if (Object.prototype.hasOwnProperty.call(actionConfigs, type)) {
	      var config = actionConfigs[type];
	      var actionName = (0, _camelcase2.default)(type);

	      if (typeof config === 'function') {
	        actions[actionName] = createAction(type, config);
	      } else {
	        var _ref = config || {};

	        var payload = _ref.payload;
	        var meta = _ref.meta;

	        actions[actionName] = createAction(type, payload, meta);
	      }
	    }
	  }
	  return actions;
	}

	function getAsyncMeta(metaCreator, payload, asyncPhase) {
	  var asyncMetaCreator = typeof metaCreator === 'function' ? metaCreator : function (payload, defaultMeta) {
	    return _extends({}, defaultMeta, metaCreator);
	  };

	  return asyncMetaCreator(payload, { asyncPhase: asyncPhase });
	}

	function createAsyncAction(type, payloadCreator, metaCreator) {
	  var startAction = createAction(type, identity, function (_, meta) {
	    return meta;
	  });
	  var completeAction = createAction(type + '_' + ASYNC_PHASES.COMPLETED, identity, function (_, meta) {
	    return meta;
	  });
	  var failedAction = createAction(type + '_' + ASYNC_PHASES.FAILED, identity, function (_, meta) {
	    return meta;
	  });

	  return function (initPayload) {
	    return function (dispatch) {
	      dispatch(startAction(initPayload, getAsyncMeta(metaCreator, initPayload, ASYNC_PHASES.START)));

	      var promise = payloadCreator(initPayload);

	      if (promise && typeof promise.then === 'function') {
	        promise.then(function (value) {
	          dispatch(completeAction(value, getAsyncMeta(metaCreator, value, ASYNC_PHASES.COMPLETED)));
	        }, function (e) {
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
	      actionType.forEach(function (type) {
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

	      var handler = action ? _this2.handlers[action.type] : undefined;

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

	function createReducer() {
	  return new ActionHandler();
	}

	exports.createAction = createAction;
	exports.createActions = createActions;
	exports.createAsyncAction = createAsyncAction;
	exports.createReducer = createReducer;
	exports.ASYNC_PHASES = ASYNC_PHASES;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	function preserveCamelCase(str) {
		var isLastCharLower = false;

		for (var i = 0; i < str.length; i++) {
			var c = str.charAt(i);

			if (isLastCharLower && (/[a-zA-Z]/).test(c) && c.toUpperCase() === c) {
				str = str.substr(0, i) + '-' + str.substr(i);
				isLastCharLower = false;
				i++;
			} else {
				isLastCharLower = (c.toLowerCase() === c);
			}
		}

		return str;
	}

	module.exports = function () {
		var str = [].map.call(arguments, function (str) {
			return str.trim();
		}).filter(function (str) {
			return str.length;
		}).join('-');

		if (!str.length) {
			return '';
		}

		if (str.length === 1) {
			return str.toLowerCase();
		}

		if (!(/[_.\- ]+/).test(str)) {
			if (str === str.toUpperCase()) {
				return str.toLowerCase();
			}

			if (str[0] !== str[0].toLowerCase()) {
				return str[0].toLowerCase() + str.slice(1);
			}

			return str;
		}

		str = preserveCamelCase(str);

		return str
		.replace(/^[_.\- ]+/, '')
		.toLowerCase()
		.replace(/[_.\- ]+(\w|$)/g, function (m, p1) {
			return p1.toUpperCase();
		});
	};


/***/ }
/******/ ])
});
;