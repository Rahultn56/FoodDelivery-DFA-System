import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STATES,
  ALPHABET,
  INITIAL_STATE,
  FINAL_STATES,
  TRANSITIONS,
  transition,
  isFinalState,
  getValidActions,
  simulateString,
  getDfaMetadata
} from '../src/dfa/orderDfa.js';

test('DFA Formal 5-tuple M = (Q, Sigma, delta, q0, F) definition verification', () => {
  // Q has exactly 7 states S0 through S6
  assert.deepEqual(Object.keys(STATES), ['S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6']);
  // Initial state q0 is S0
  assert.equal(INITIAL_STATE, 'S0');
  // Final states F = {S5, S6}
  assert.deepEqual([...FINAL_STATES].sort(), ['S5', 'S6']);
  // Sigma contains 6 valid alphabet symbols
  assert.deepEqual(ALPHABET, [
    'confirm',
    'start_preparation',
    'food_ready',
    'dispatch',
    'deliver',
    'cancel'
  ]);
});

test('Valid transitions delta(q, a) match the formal state transition table', () => {
  const definedTransitions = [
    ['S0', 'confirm', 'S1'],
    ['S0', 'cancel', 'S6'],
    ['S1', 'start_preparation', 'S2'],
    ['S1', 'cancel', 'S6'],
    ['S2', 'food_ready', 'S3'],
    ['S3', 'dispatch', 'S4'],
    ['S4', 'deliver', 'S5']
  ];

  for (const [state, action, expectedNext] of definedTransitions) {
    const result = transition(state, action);
    assert.equal(result.valid, true, `Transition from ${state} with ${action} should be valid`);
    assert.equal(result.nextState, expectedNext, `Expected ${state} -> ${expectedNext}`);
    assert.equal(typeof result.label, 'string');
    assert.equal(typeof result.formalExplanation, 'string');
  }
});

test('Strictly rejects state-skipping and undefined transitions (delta is a partial function)', () => {
  const invalidJumps = [
    ['S0', 'start_preparation'], // cannot cook before confirming
    ['S0', 'food_ready'],        // cannot jump S0 -> S3
    ['S0', 'dispatch'],          // cannot dispatch before prep
    ['S0', 'deliver'],           // cannot deliver before prep
    ['S1', 'food_ready'],        // cannot mark ready before start_prep
    ['S1', 'dispatch'],
    ['S2', 'dispatch'],          // cannot dispatch while cooking
    ['S2', 'cancel'],            // cannot cancel once cooking has started!
    ['S3', 'deliver'],           // cannot deliver before dispatch
    ['S3', 'cancel'],            // cannot cancel after food is ready
    ['S4', 'confirm'],           // cannot re-confirm once on road
    ['S4', 'cancel']             // cannot cancel once out for delivery
  ];

  for (const [state, action] of invalidJumps) {
    const result = transition(state, action);
    assert.equal(result.valid, false, `delta(${state}, ${action}) must be rejected`);
    assert.match(result.error, /undefined/i);
    assert.ok(Array.isArray(result.allowedActions));
  }
});

test('Strictly protects terminal states F = {S5, S6} from any outgoing transitions', () => {
  for (const finalState of FINAL_STATES) {
    assert.equal(isFinalState(finalState), true);
    for (const action of ALPHABET) {
      const result = transition(finalState, action);
      assert.equal(result.valid, false, `Terminal state ${finalState} cannot take action ${action}`);
      assert.match(result.error, /final state/i);
    }
  }
});

test('Rejects unknown states and invalid input alphabet symbols', () => {
  // Unknown state
  const badState = transition('S99', 'confirm');
  assert.equal(badState.valid, false);
  assert.match(badState.error, /Invalid DFA state/);

  // Invalid alphabet symbol
  const badSymbol = transition('S0', 'instant_teleport');
  assert.equal(badSymbol.valid, false);
  assert.match(badSymbol.error, /Invalid input symbol/);
});

test('Simulates string sequences w in Sigma* and verifies language membership L(M)', () => {
  // 1. Happy path to delivery: S0 -> S1 -> S2 -> S3 -> S4 -> S5 (Accepted)
  const fullOrder = ['confirm', 'start_preparation', 'food_ready', 'dispatch', 'deliver'];
  const sim1 = simulateString(fullOrder);
  assert.equal(sim1.accepted, true, 'Full order string must be accepted into L(M)');
  assert.equal(sim1.finalState, 'S5');
  assert.equal(sim1.trace.length, 5);

  // 2. Cancellation at S0: S0 -> S6 (Accepted)
  const cancelAtS0 = ['cancel'];
  const sim2 = simulateString(cancelAtS0);
  assert.equal(sim2.accepted, true, 'Cancellation at S0 must be accepted into L(M)');
  assert.equal(sim2.finalState, 'S6');

  // 3. Cancellation at S1: S0 -> S1 -> S6 (Accepted)
  const cancelAtS1 = ['confirm', 'cancel'];
  const sim3 = simulateString(cancelAtS1);
  assert.equal(sim3.accepted, true, 'Cancellation at S1 must be accepted into L(M)');
  assert.equal(sim3.finalState, 'S6');

  // 4. Incomplete string stopping at S3: not in F (Rejected)
  const incomplete = ['confirm', 'start_preparation', 'food_ready'];
  const sim4 = simulateString(incomplete);
  assert.equal(sim4.accepted, false, 'Incomplete lifecycle string must not be accepted');
  assert.equal(sim4.finalState, 'S3');

  // 5. Invalid transition sequence: confirm -> dispatch (Rejected immediately at step 2)
  const illegalSequence = ['confirm', 'dispatch'];
  const sim5 = simulateString(illegalSequence);
  assert.equal(sim5.accepted, false);
  assert.equal(sim5.trace[1].valid, false);
});

test('getDfaMetadata returns complete mathematical model', () => {
  const meta = getDfaMetadata();
  assert.equal(meta.initialState, 'S0');
  assert.equal(meta.finalStates.length, 2);
  assert.equal(meta.transitionTable.length, 7);
});
