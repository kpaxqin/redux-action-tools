import { expect } from 'chai';
import sinon from 'sinon';
import { isFSA } from 'flux-standard-action';
import { createAsyncAction, ASYNC_PHASES } from '../src/index';

describe('createAsyncAction', () => {
  let dispatch, getState;
  const type = "ACTION";

  function invokeThunk (thunk) {
    return thunk(dispatch, getState);
  }

  function setDispatchForAsyncCase(assertion, done) {
    dispatch = sinon.spy(function(action) {
      try {
        if (dispatch.callCount === 2) { //skip the first call of dispatch
          assertion(action);

          done();
        }
      } catch(e) {
        done(e)
      }
    });
  }

  context('when action triggered', () => {
    beforeEach(() => {
      dispatch = sinon.spy();
      getState = sinon.spy();
    });

    it('dispatch a FSA action immediately when action triggered', () => {
      const actionCreator = createAsyncAction(type, createPromisePayload, {foo: 1});
      const syncPayload = {};
      const thunk = actionCreator(syncPayload);
      invokeThunk(thunk);

      const action = dispatch.args[0][0];

      expect(isFSA(action)).to.be.true;
      expect(action.type).to.equal(type);
      expect(action.payload).to.equal(syncPayload);
      expect(action.meta).to.deep.equal({
        asyncPhase: ASYNC_PHASES.START,
        foo: 1
      })
    });

    it('dispatch a FSA action immediately when action triggered and metaCreator is provided', () => {
      const actionCreator = createAsyncAction(type, createPromisePayload, (payload, meta) => ({...payload, ...meta}));
      const syncPayload = {foo: 2};
      const thunk = actionCreator(syncPayload);
      invokeThunk(thunk);

      const action = dispatch.args[0][0];

      expect(isFSA(action)).to.be.true;
      expect(action.type).to.equal(type);
      expect(action.payload).to.equal(syncPayload);
      expect(action.meta).to.deep.equal({
        asyncPhase: ASYNC_PHASES.START,
        foo: 2
      })
    });

    it('should call promiseCreator with dispatch and getState as second & third arguments', () => {
      const actionCreator = createAsyncAction(type, (payload, second, third) => {
        expect(second).to.equal(dispatch);
        expect(third).to.equal(getState);
        return Promise.resolve(payload);
      });

      const syncPayload = {foo: 2};
      const thunk = actionCreator(syncPayload);
      invokeThunk(thunk);
    });

    it('should throw error if payloadCreator haven\'t return a promise', () => {
      expect(() => {
        const actionCreator = createAsyncAction(type, () => {
          return 'not a promise'
        });

        invokeThunk(actionCreator());
      }).to.throw(Error, 'payloadCreator should return a promise')
    });

    it('should return a promise object for invoke', () => {
      const actionCreator = createAsyncAction(type, (payload) => {
        return Promise.resolve(payload)
      });

      const result = invokeThunk(actionCreator());

      expect(typeof result.then).to.be.equal('function');
    });

  });

  context('when promise resolved', () => {
    it('dispatch a FSA action with resolved value', (done) => {
      const actionCreator = createAsyncAction(type, createPromisePayload);
      const syncPayload = {foo: 2};
      const thunk = actionCreator(syncPayload);

      setDispatchForAsyncCase((action) => {
        expect(isFSA(action)).to.be.true;
        expect(action.payload).to.deep.equal({
          bar: 1,
          foo: 2
        });
        expect(action.meta).to.deep.equal({
          asyncPhase: ASYNC_PHASES.COMPLETED
        })
      }, done);

      invokeThunk(thunk);
    });

    it('dispatch a FSA action with resolved value when metaCreator is provided', (done) => {
      const actionCreator = createAsyncAction(type, createPromisePayload, (payload, meta) => ({...payload, ...meta}));
      const syncPayload = {foo: 2};
      const thunk = actionCreator(syncPayload);

      setDispatchForAsyncCase((action) => {
        expect(isFSA(action)).to.be.true;
        expect(action.payload).to.deep.equal({
          bar: 1,
          foo: 2
        });
        expect(action.meta).to.deep.equal({
          asyncPhase: ASYNC_PHASES.COMPLETED,
          bar: 1,
          foo: 2
        })
      }, done);

      invokeThunk(thunk);
    });

    it('resolve the promise returned by invoke', done => {
      dispatch = sinon.spy();

      const actionCreator = createAsyncAction(type, (payload) => {
        return Promise.resolve(payload)
      });

      const payload = {};

      const result = invokeThunk(actionCreator(payload));

      result.then((result) => {
        expect(result).to.equal(payload);
        done();
      }).catch(e => done(e));
    })
  });

  context('when promise rejected', () => {
    it('dispatch a FSA action with rejected error', (done) => {
      const actionCreator = createAsyncAction(type, createPromisePayload);
      const syncPayload = {error: true, msg: 'oops'};
      const thunk = actionCreator(syncPayload);

      setDispatchForAsyncCase((action) => {
        expect(isFSA(action)).to.be.true;
        expect(action.error).to.be.true;
        expect(action.payload).to.deep.equal(new Error(syncPayload.msg));
        expect(action.meta).to.deep.equal({
          asyncPhase: ASYNC_PHASES.FAILED
        })
      }, done);

      invokeThunk(thunk);
    });

    it('dispatch a FSA action with rejected error when metaCreator is provided', (done) => {
      const actionCreator = createAsyncAction(type, createPromisePayload, (payload, meta) => ({errorMsg: payload.message, ...meta}));
      const syncPayload = {error: true, msg: 'oops'};
      const thunk = actionCreator(syncPayload);

      setDispatchForAsyncCase((action) => {
        expect(isFSA(action)).to.be.true;
        expect(action.error).to.be.true;
        expect(action.payload).to.deep.equal(new Error(syncPayload.msg));
        expect(action.meta).to.deep.equal({
          asyncPhase: ASYNC_PHASES.FAILED,
          errorMsg: 'oops'
        });
      }, done);

      invokeThunk(thunk);
    });

    it('reject the promise returned by invoke', done => {
      dispatch = sinon.spy();

      const actionCreator = createAsyncAction(type, (payload) => {
        return Promise.reject(new Error('rejected'))
      });

      const payload = {};

      const result = invokeThunk(actionCreator(payload));

      result.then(() => {
        done(new Error('promise should not resolved'));
      }, e => {
        expect(e).to.be.instanceOf(Error);
        expect(e.message).to.equal('rejected');
        done();
      }).catch(e => done(e));
    })
  });

  context('when error occurs while dispatching the action for promise resolved', () => {
    it('should not call dispatch for the error', (done) => {
      const actionCreator = createAsyncAction(type, createPromisePayload);
      const syncPayload = {foo: 1};
      const thunk = actionCreator(syncPayload);

      dispatch = sinon.spy(function() {
        if (dispatch.callCount === 2) { // throw error for the promise resolve action
          process.nextTick(() => {
            try{
              expect(dispatch.callCount).to.equal(2);
              done();
            } catch (e) {
              done(e);
            }
          });

          throw new Error('dispatch error')
        }
      });

      invokeThunk(thunk);
    });
  })
});

function createPromisePayload(result) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      if (result.error) {
        reject(new Error(result.msg));
      } else {
        resolve({
          ...result,
          bar: 1
        })
      }
    });
  });
}