/**
 * Formal Languages and Automata Theory (FLAT) Module
 * Deterministic Finite Automaton (DFA) for Order Processing
 *
 * Mathematical Definition:
 * M = (Q, Sigma, delta, q0, F)
 *
 * Where:
 * Q     = Set of 7 states {S0, S1, S2, S3, S4, S5, S6}
 * Sigma = Input alphabet {confirm, start_preparation, food_ready, dispatch, deliver, cancel}
 * delta = Transition function Q x Sigma -> Q (partial function)
 * q0    = Initial state (S0)
 * F     = Set of final / accepting states {S5, S6}
 */

export const STATES = Object.freeze({
  S0: 'Order Created',
  S1: 'Order Confirmed',
  S2: 'Food Preparation Started',
  S3: 'Food Prepared',
  S4: 'Out for Delivery',
  S5: 'Delivered',
  S6: 'Cancelled'
});

export const STATE_DESCRIPTIONS = Object.freeze({
  S0: 'Customer has placed the order. Waiting for restaurant acceptance or cancellation.',
  S1: 'Restaurant staff accepted the order. Kitchen queue assigned.',
  S2: 'Chef has started cooking food. Cannot be cancelled beyond this point.',
  S3: 'Food is fully prepared, quality checked, and packed in warm containers.',
  S4: 'Delivery partner has picked up the package and is traveling to the customer.',
  S5: 'Package handed over to customer. Order lifecycle successfully completed (Final State).',
  S6: 'Order cancelled by customer or rejected by restaurant (Terminal State).'
});

export const INITIAL_STATE = 'S0';

export const FINAL_STATES = Object.freeze(['S5', 'S6']);

export const ALPHABET = Object.freeze([
  'confirm',
  'start_preparation',
  'food_ready',
  'dispatch',
  'deliver',
  'cancel'
]);

export const ALPHABET_LABELS = Object.freeze({
  confirm: 'Accept & Confirm Order',
  start_preparation: 'Start Cooking / Preparation',
  food_ready: 'Mark Food Prepared & Packed',
  dispatch: 'Dispatch with Delivery Partner',
  deliver: 'Mark as Handed Over / Delivered',
  cancel: 'Cancel / Reject Order'
});

/**
 * State Transition Table delta: Q x Sigma -> Q
 */
export const TRANSITIONS = Object.freeze({
  S0: Object.freeze({
    confirm: 'S1',
    cancel: 'S6'
  }),
  S1: Object.freeze({
    start_preparation: 'S2',
    cancel: 'S6'
  }),
  S2: Object.freeze({
    food_ready: 'S3'
  }),
  S3: Object.freeze({
    dispatch: 'S4'
  }),
  S4: Object.freeze({
    deliver: 'S5'
  }),
  S5: Object.freeze({}),
  S6: Object.freeze({})
});

/**
 * Check if a state is a final/terminal state
 * @param {string} state
 * @returns {boolean}
 */
export function isFinalState(state) {
  return FINAL_STATES.includes(state);
}

/**
 * Retrieve list of valid input alphabet symbols from a given state
 * @param {string} state
 * @returns {string[]}
 */
export function getValidActions(state) {
  const transitionsFromState = TRANSITIONS[state];
  return transitionsFromState ? Object.keys(transitionsFromState) : [];
}

/**
 * Executes DFA transition: delta(currentState, input) -> nextState
 *
 * Enforces:
 * 1. Current state must be valid element of Q.
 * 2. Input must be valid element of Sigma.
 * 3. Final states (S5, S6) cannot transition anywhere (terminal).
 * 4. Undefined transitions in delta are strictly rejected (HTTP 422).
 * 5. Skipping intermediate states is mathematically impossible.
 *
 * @param {string} currentState
 * @param {string} input
 * @returns {{ valid: boolean, currentState: string, input: string, nextState?: string, label?: string, error?: string, allowedActions?: string[], formalExplanation?: string }}
 */
export function transition(currentState, input) {
  // 1. Validate currentState in Q
  if (!STATES[currentState]) {
    return {
      valid: false,
      currentState,
      input,
      error: `Invalid DFA state: "${currentState}". State must belong to Q = {${Object.keys(STATES).join(', ')}}.`,
      allowedActions: []
    };
  }

  // 2. Validate input in Sigma
  if (!ALPHABET.includes(input)) {
    return {
      valid: false,
      currentState,
      input,
      error: `Invalid input symbol: "${input}". Input must belong to alphabet Sigma = {${ALPHABET.join(', ')}}.`,
      allowedActions: getValidActions(currentState)
    };
  }

  // 3. Final State Check
  if (isFinalState(currentState)) {
    return {
      valid: false,
      currentState,
      input,
      error: `Cannot transition from final state "${currentState}" (${STATES[currentState]}). Terminal states in F = {S5, S6} have no outgoing transitions.`,
      allowedActions: [],
      formalExplanation: `delta(${currentState}, ${input}) is undefined because ${currentState} in F.`
    };
  }

  // 4. Lookup transition in delta
  const nextState = TRANSITIONS[currentState]?.[input];
  if (!nextState) {
    const valid = getValidActions(currentState);
    const validText = valid.length > 0 ? valid.map((a) => `"${a}"`).join(' or ') : 'none';
    return {
      valid: false,
      currentState,
      input,
      error: `Transition delta(${currentState}, "${input}") is undefined. Current state is ${currentState} (${STATES[currentState]}). Allowed input(s): ${validText}.`,
      allowedActions: valid,
      formalExplanation: `In DFA M, delta(${currentState}, ${input}) -> null. Undefined transition rejected to prevent illegal state jump.`
    };
  }

  // 5. Successful Transition
  return {
    valid: true,
    currentState,
    input,
    nextState,
    label: STATES[nextState],
    description: STATE_DESCRIPTIONS[nextState],
    isFinal: isFinalState(nextState),
    formalExplanation: `delta(${currentState}, ${input}) = ${nextState} (${STATES[nextState]})`
  };
}

/**
 * Simulates a full string w in Sigma* starting from q0 = S0
 * @param {string[]} inputSequence Array of input alphabet symbols
 * @returns {{ accepted: boolean, trace: Array<{step: number, from: string, input: string, to: string, valid: boolean}>, finalState: string, reason: string }}
 */
export function simulateString(inputSequence = []) {
  let state = INITIAL_STATE;
  const trace = [];

  for (let i = 0; i < inputSequence.length; i++) {
    const sym = inputSequence[i];
    const res = transition(state, sym);
    if (!res.valid) {
      trace.push({
        step: i + 1,
        from: state,
        input: sym,
        to: null,
        valid: false,
        error: res.error
      });
      return {
        accepted: false,
        trace,
        finalState: state,
        reason: `DFA crashed at step ${i + 1} on input "${sym}": ${res.error}`
      };
    }

    trace.push({
      step: i + 1,
      from: state,
      input: sym,
      to: res.nextState,
      valid: true,
      label: res.label
    });
    state = res.nextState;
  }

  const accepted = isFinalState(state);
  return {
    accepted,
    trace,
    finalState: state,
    reason: accepted
      ? `String accepted! Automaton halted in final state ${state} (${STATES[state]}).`
      : `String halted in non-final state ${state} (${STATES[state]}). Not in L(M).`
  };
}

/**
 * Returns formal DFA metadata for documentation, API inspection and UI visualization
 */
export function getDfaMetadata() {
  return {
    name: 'Food Order Processing DFA',
    formalDefinition: 'M = (Q, Sigma, delta, q0, F)',
    states: STATES,
    stateDescriptions: STATE_DESCRIPTIONS,
    alphabet: ALPHABET,
    alphabetLabels: ALPHABET_LABELS,
    initialState: INITIAL_STATE,
    finalStates: FINAL_STATES,
    transitionTable: Object.entries(TRANSITIONS).flatMap(([fromState, actions]) =>
      Object.entries(actions).map(([action, toState]) => ({
        fromState,
        fromLabel: STATES[fromState],
        action,
        actionLabel: ALPHABET_LABELS[action],
        toState,
        toLabel: STATES[toState]
      }))
    ),
    languageSummary: 'L(M) = { confirm.start_preparation.food_ready.dispatch.deliver, cancel, confirm.cancel }'
  };
}
