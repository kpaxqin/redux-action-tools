import { expect } from 'chai';
import { createReducer } from '../src';

const FOO_ACTION= 'FOO',
  BAR_ACTION= 'BAR';

function getHandler(suffix) {
  return (state, action) => `${state}|${suffix}-${action.payload}`
}

describe('createReducer', () => {
  it('should create reducer function to handle action', () => {
    const reducer = createReducer()
      .when(FOO_ACTION, getHandler('FOO'))
      .build('initValue');

    expect(typeof reducer).to.equal('function');
    expect(reducer()).to.equal('initValue');
    expect(reducer('init', {type: FOO_ACTION, payload: 'foo'}))
      .to.equal('init|FOO-foo');
  });

  it('should create same handler for multi actions', () => {
    const reducer = createReducer()
      .when([FOO_ACTION, BAR_ACTION], getHandler('MULTI'))
      .build();

    expect(reducer('init', {type: FOO_ACTION, payload: 'foo'}))
      .to.equal('init|MULTI-foo');

    expect(reducer('init', {type: BAR_ACTION, payload: 'bar'}))
      .to.equal('init|MULTI-bar');
  });

  it('should create reducer function which can handle async case', () => {
    const reducer = createReducer()
      .when(FOO_ACTION, getHandler('FOO'))
      .done(getHandler('FOO_COMPLETED'))
      .failed(getHandler('FOO_FAILED'))
      .build();

    expect(reducer('init', {type: `${FOO_ACTION}_COMPLETED`, payload: 'foo completed'}))
      .to.equal('init|FOO_COMPLETED-foo completed');

    expect(reducer('init', {type: `${FOO_ACTION}_FAILED`, payload: 'foo failed'}))
      .to.equal('init|FOO_FAILED-foo failed');
  });

  it('should throw Error when use done or failed without follow when(action, handler)', () => {
    const runner = () => {
      createReducer()
        .done(getHandler('FOO_COMPLETED'))
        .failed(getHandler('FOO_FAILED'))
        .build()
    };
    expect(
      runner
    ).to.throw(
      Error,
      'Method "done" & "failed" must follow the "when(action, ?handler)", and "action" should not be an array'
    );
  });

  it('should throw Error when use done or failed after when([...actions], handler)', () => {
    const runner = () => {
      createReducer()
        .when([FOO_ACTION, BAR_ACTION])
        .done(getHandler('FOO_COMPLETED'))
        .failed(getHandler('FOO_FAILED'))
        .build()
    };

    expect(
      runner
    ).to.throw(
      Error,
      'Method "done" & "failed" must follow the "when(action, ?handler)", and "action" should not be an array'
    );
  });
});
