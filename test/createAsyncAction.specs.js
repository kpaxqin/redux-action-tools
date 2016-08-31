import { expect } from 'chai';
import sinon from 'sinon';
import { isFSA } from 'flux-standard-action';
import { createAsyncAction, ASYNC_PHASES } from '../src/index';

const sandbox = sinon.sandbox.create();

describe.only('createAsyncAction', () => {
  let dispatch;
  const type = "ACTION";

  function invokeThunk (thunk) {
    thunk(dispatch);
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
    })

  });
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