import { expect } from 'chai';
import { createActions } from '../src';

describe('createActions', () => {

  it('should return a map of action creators', () => {
    const { actionOne, actionTwo } = createActions({
      ACTION_ONE: (foo, bar) => (foo + bar),
      ACTION_TWO: (foo, bar) => (foo * bar)
    });

    expect(actionOne(1, 2)).to.deep.equal({
      type: 'ACTION_ONE',
      payload: 3
    });

    expect(actionTwo(2, 3)).to.deep.equal({
      type: 'ACTION_TWO',
      payload: 6
    });
  });

  it('should use identity when config for action is undefined', () => {
    const { actionOne, actionTwo } = createActions({
      ACTION_ONE: undefined,
      ACTION_TWO: undefined
    });

    expect(actionOne(1)).to.deep.equal({
      type: 'ACTION_ONE',
      payload: 1
    });

    expect(actionTwo(2)).to.deep.equal({
      type: 'ACTION_TWO',
      payload: 2
    });
  });

  it('should use the payload and meta creator provided in config', () => {
    const { actionOne, actionTwo } = createActions({
      ACTION_ONE: {
        payload: (foo, bar) => (foo + bar),
        meta: (foo, bar) => foo
      },
      ACTION_TWO: {
        payload: (foo, bar) => (foo * bar),
        meta: (foo, bar) => bar
      }
    });

    expect(actionOne(1, 2)).to.deep.equal({
      type: 'ACTION_ONE',
      payload: 3,
      meta: 1
    });

    expect(actionTwo(2, 3)).to.deep.equal({
      type: 'ACTION_TWO',
      payload: 6,
      meta: 3
    });
  });

});