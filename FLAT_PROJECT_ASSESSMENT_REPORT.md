VELALAR COLLEGE OF ENGINEERING AND TECHNOLOGY, ERODE -12
(AUTONOMOUS)
DEPARTMENT OF INFORMATION TECHNOLOGY
ACADEMIC YEAR: 2026 -27 (ODD)
ACTIVITY- Project-Based Assessment
NAME : Rahul G
CLASS: 24IT5A
REG.NO: 732924ITR089
SUBJECT CODE: 22ITT53
SUBJECT NAME: FORMAL LANGUAGES AND AUTOMATA THEORY (FLAT)
PROBLEM STATEMENT : Build a web application that enforces valid lifecycle state transitions in an online food ordering and real-time delivery tracking system using a Deterministic Finite Automaton (DFA). Prevent illegal state transitions, state-skipping, and post-fulfillment modifications through formal automata validation. Display order progress, state transition matrices, and rejection proofs on an interactive web dashboard.
Title Assigned : Online Food Ordering and Delivery Tracking System Using DFA

---

# 1. STATE DIAGRAM

## 1.1 Introduction
A Deterministic Finite Automaton (DFA) is used in the **Online Food Ordering and Delivery Tracking System** project to model, govern, and strictly validate the complete lifecycle of customer orders. In commercial food delivery applications, orders must strictly follow an operational sequence: from initial order placement, kitchen staff confirmation, cooking preparation, packaging, dispatch via courier, to final delivery handover.

The automaton starts from the initial state **S0 (Order Created)**. Whenever authorized actors (customer, kitchen manager, delivery partner) submit an action, the DFA evaluates the transition function $\delta(\text{state}, \text{action})$. If the action is legally defined for the current state, the DFA advances deterministically to the next state. If an undefined action or illegal state jump is attempted (e.g., trying to dispatch food before cooking, or cancelling food after preparation has commenced), the transition is strictly rejected with mathematical proof. When the order reaches **S5 (Delivered)** or **S6 (Cancelled)**, it enters a final/accepting state with zero outgoing transitions, guaranteeing that completed orders cannot be altered.

## 1.2 States of the DFA
| State | Formal Label | Description | State Category |
|---|---|---|---|
| **S0** | Order Created | Customer placed food order. Awaiting restaurant acceptance or cancellation. | Initial State ($q_0$) |
| **S1** | Order Confirmed | Restaurant verified and accepted order. Assigned to kitchen preparation queue. | Intermediate State |
| **S2** | Preparation Started | Chef began cooking ingredients. Cancellation locked to prevent restaurant wastage. | Intermediate State |
| **S3** | Food Prepared | Cooking completed; dishes packed in insulated boxes; ready for courier pickup. | Intermediate State |
| **S4** | Out for Delivery | Assigned delivery courier picked up package; traveling to customer address. | Intermediate State |
| **S5** | Delivered | Package safely handed over to customer. Order lifecycle successfully fulfilled. | Final / Accepting ($F$) |
| **S6** | Cancelled | Order cancelled by customer in S0/S1 or rejected by restaurant. Terminal state. | Final / Terminal ($F$) |

## 1.3 State Diagram Representation :
Online Food Ordering & Delivery Tracking – DFA State Diagram
The automaton contains seven states. It guarantees deterministic progression along the main fulfillment pipeline ($S_0 \to S_1 \to S_2 \to S_3 \to S_4 \to S_5$) and accepts controlled cancellation branches to $S_6$ only before food preparation starts.

```
       [Start]
          │
          ▼
       ┌──────┐      confirm      ┌──────┐  start_prep   ┌──────┐  food_ready   ┌──────┐
       │  S0  │ ────────────────> │  S1  │ ────────────> │  S2  │ ────────────> │  S3  │
       └──────┘                   └──────┘               └──────┘               └──────┘
          │                          │                                              │
          │ cancel                   │ cancel                                       │ dispatch
          │                          │                                              ▼
          ▼                          ▼                                          ┌──────┐
       ┌────────────────────────────────┐                                       │  S4  │
       │           (( S6 ))             │                                       └──────┘
       │          [CANCELLED]           │                                           │
       └────────────────────────────────┘                                           │ deliver
                                                                                    ▼
                                                                                ╔══════╗
                                                                                ║  S5  ║  [DELIVERED]
                                                                                ╚══════╝  (FINAL STATE)
```

**State Description:**
- **S0** – Initial state ($q_0$); customer placed order; awaiting kitchen confirmation.
- **S1** – Order confirmed by restaurant; queued for preparation.
- **S2** – Food preparation started; chef cooking; cancellation locked.
- **S3** – Food preparation finished; items inspected and packed.
- **S4** – Out for delivery; delivery courier traveling to customer location.
- **S5** – Delivered; package handed over; order completed successfully (Final State $\in F$).
- **S6** – Cancelled; order cancelled or rejected before cooking started (Final State $\in F$).

## 1.4 Formal Definition of DFA
A Deterministic Finite Automaton is represented by the 5-tuple:

$$M = (Q, \Sigma, \delta, q_0, F)$$

Where:
- **$Q$**: Finite set of states $= \{S_0, S_1, S_2, S_3, S_4, S_5, S_6\}$
- **$\Sigma$**: Finite input alphabet $= \{\text{confirm}, \text{start\_preparation}, \text{food\_ready}, \text{dispatch}, \text{deliver}, \text{cancel}\}$
- **$\delta$**: Partial state transition function $\delta: Q \times \Sigma \to Q$
- **$q_0$**: Initial state $= S_0$
- **$F$**: Set of final / accepting states $= \{S_5, S_6\}$

**Language Accepted by the Automaton $L(M)$:**
The DFA accepts the input sequence when an order completes the legitimate workflow to final state $S_5$ or is aborted cleanly to $S_6$:

$$L(M) = \{ \text{confirm} \cdot \text{start\_preparation} \cdot \text{food\_ready} \cdot \text{dispatch} \cdot \text{deliver}, \; \text{cancel}, \; \text{confirm} \cdot \text{cancel} \}$$

---

# 2. TRANSITION DIAGRAM
The transition diagram represents the movement of the DFA from one state to another based on incoming operational events dispatched from the client application.

```
┌──────┐  confirm   ┌──────┐  start_prep  ┌──────┐  food_ready  ┌──────┐  dispatch   ┌──────┐  deliver   ╔══════╗
│  S0  │ ─────────> │  S1  │ ───────────> │  S2  │ ───────────> │  S3  │ ──────────> │  S4  │ ─────────> ║  S5  ║
└──────┘            └──────┘              └──────┘              └──────┘             └──────┘            ╚══════╝
   │                   │
   │ cancel            │ cancel
   ▼                   ▼
┌─────────────────────────┐
│        (( S6 ))         │
└─────────────────────────┘
```

## 2.1 Transition Table :
| Current State ($q$) | Input Condition ($\sigma$) | Next State ($\delta$) | Formal Transition Proof & Description |
|---|---|---|---|
| **S0** | `confirm` | **S1** | $\delta(S_0, \text{confirm}) = S_1$ (Order accepted into kitchen queue) |
| **S0** | `cancel` | **S6** | $\delta(S_0, \text{cancel}) = S_6$ (Cancelled by customer or rejected) |
| **S1** | `start_preparation` | **S2** | $\delta(S_1, \text{start\_prep}) = S_2$ (Chef begins cooking dishes) |
| **S1** | `cancel` | **S6** | $\delta(S_1, \text{cancel}) = S_6$ (Cancelled before cooking commences) |
| **S2** | `food_ready` | **S3** | $\delta(S_2, \text{food\_ready}) = S_3$ (Cooking complete; food packed) |
| **S3** | `dispatch` | **S4** | $\delta(S_3, \text{dispatch}) = S_4$ (Delivery partner assigned & traveling) |
| **S4** | `deliver` | **S5** | $\delta(S_4, \text{deliver}) = S_5$ (Food delivered to customer) |
| **S5** | Any $\sigma \in \Sigma$ | $\emptyset$ (REJECT) | $\delta(S_5, \sigma)$ is undefined; terminal accepting state |
| **S6** | Any $\sigma \in \Sigma$ | $\emptyset$ (REJECT) | $\delta(S_6, \sigma)$ is undefined; terminal cancelled state |

**Special Conditions:**
1. **Undefined Transitions:** Any transition not explicitly defined above evaluates to $\emptyset$ and is rejected by the backend with an **HTTP 422 Unprocessable Entity** status.
2. **Cancellation Lock:** Beyond state $S_1$, the `cancel` action is strictly undefined ($\delta(S_2, \text{cancel}) = \emptyset$), preventing customer cancellation after raw materials have been cooked.
3. **Terminal Invariance:** Both $S_5$ and $S_6$ have zero outgoing transitions ($\delta(S_5, \sigma) = \emptyset, \delta(S_6, \sigma) = \emptyset$), guaranteeing that completed or cancelled orders are immutable.

## 2.2 Example of State Transitions :
Consider an order placed by customer Alex Morgan (Order ID `#692a4e`) progressing from placement to delivery:

| Step | Actor | Action Triggered | DFA Previous State | DFA Next State | Formal Proof |
|---|---|---|---|---|---|
| Initial | Customer | Order Placed | — | **S0** | $q_0 = S_0$ |
| 1 | Restaurant Admin | `confirm` | **S0** | **S1** | $\delta(S_0, \text{confirm}) = S_1$ |
| 2 | Kitchen Chef | `start_preparation`| **S1** | **S2** | $\delta(S_1, \text{start\_prep}) = S_2$ |
| 3 | Kitchen Chef | `food_ready` | **S2** | **S3** | $\delta(S_2, \text{food\_ready}) = S_3$ |
| 4 | Delivery Partner | `dispatch` | **S3** | **S4** | $\delta(S_3, \text{dispatch}) = S_4$ |
| 5 | Delivery Partner | `deliver` | **S4** | **S5** | $\delta(S_4, \text{deliver}) = S_5 \in F$ |

**Result:** After five sequential transitions, the DFA reaches accepting state **S5**, and the system confirms successful order delivery.

---

# CODE:
**File Name: orderDfa.js** (Location: `server/src/dfa/orderDfa.js`)

```javascript
/**
 * Formal Languages and Automata Theory (FLAT) Module
 * Deterministic Finite Automaton (DFA) for Order Processing
 *
 * Mathematical Definition:
 * M = (Q, Sigma, delta, q0, F)
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

/**
 * State Transition Table delta: Q x Sigma -> Q (Partial Function)
 */
export const TRANSITIONS = Object.freeze({
  S0: Object.freeze({ confirm: 'S1', cancel: 'S6' }),
  S1: Object.freeze({ start_preparation: 'S2', cancel: 'S6' }),
  S2: Object.freeze({ food_ready: 'S3' }),
  S3: Object.freeze({ dispatch: 'S4' }),
  S4: Object.freeze({ deliver: 'S5' }),
  S5: Object.freeze({}),
  S6: Object.freeze({})
});

export function isFinalState(state) {
  return FINAL_STATES.includes(state);
}

export function getValidActions(state) {
  const transitionsFromState = TRANSITIONS[state];
  return transitionsFromState ? Object.keys(transitionsFromState) : [];
}

/**
 * Executes DFA transition: delta(currentState, input) -> nextState
 */
export function transition(currentState, input) {
  // 1. Validate currentState in Q
  if (!STATES[currentState]) {
    return {
      valid: false,
      currentState,
      input,
      error: `Invalid DFA state: "${currentState}". State must belong to Q.`,
      allowedActions: []
    };
  }

  // 2. Validate input in Sigma
  if (!ALPHABET.includes(input)) {
    return {
      valid: false,
      currentState,
      input,
      error: `Invalid input symbol: "${input}". Must belong to alphabet Sigma.`,
      allowedActions: getValidActions(currentState)
    };
  }

  // 3. Final State Check: Terminal states have no outgoing transitions
  if (isFinalState(currentState)) {
    return {
      valid: false,
      currentState,
      input,
      error: `Cannot transition from final state "${currentState}". Terminal states in F have no outgoing transitions.`,
      allowedActions: [],
      formalExplanation: `delta(${currentState}, ${input}) is undefined because ${currentState} in F.`
    };
  }

  // 4. Lookup transition in delta
  const nextState = TRANSITIONS[currentState]?.[input];
  if (!nextState) {
    const valid = getValidActions(currentState);
    return {
      valid: false,
      currentState,
      input,
      error: `Transition delta(${currentState}, "${input}") is undefined. Current state is ${currentState} (${STATES[currentState]}). Allowed input(s): ${valid.join(' or ')}.`,
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
    isFinal: isFinalState(nextState),
    formalExplanation: `delta(${currentState}, ${input}) = ${nextState} (${STATES[nextState]})`
  };
}

/**
 * Simulates a full string w in Sigma* starting from q0 = S0
 */
export function simulateString(inputSequence = []) {
  let state = INITIAL_STATE;
  const trace = [];

  for (let i = 0; i < inputSequence.length; i++) {
    const sym = inputSequence[i];
    const res = transition(state, sym);
    if (!res.valid) {
      trace.push({ step: i + 1, from: state, input: sym, to: null, valid: false, error: res.error });
      return { accepted: false, trace, finalState: state, reason: `DFA crashed at step ${i + 1} on "${sym}".` };
    }
    trace.push({ step: i + 1, from: state, input: sym, to: res.nextState, valid: true, label: res.label });
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
```

---

# Output:
```text
> rahul-project1-api@1.0.0 test
> node --test

✔ DFA Formal 5-tuple M = (Q, Sigma, delta, q0, F) definition verification (3.17ms)
✔ Valid transitions delta(q, a) match the formal state transition table (0.51ms)
✔ Strictly rejects state-skipping and undefined transitions (delta is a partial function) (0.62ms)
✔ Strictly protects terminal states F = {S5, S6} from any outgoing transitions (0.28ms)
✔ Rejects unknown states and invalid input alphabet symbols (0.21ms)
✔ Simulates string sequences w in Sigma* and verifies language membership L(M) (0.39ms)
✔ getDfaMetadata returns complete mathematical model (0.31ms)

ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ duration_ms 139.01
```

**Step-by-Step Automaton State Traversal:**
```text
Step 1: Input symbol: "confirm"           -> Current State: S0 -> Next State: S1 [Order Confirmed]
Step 2: Input symbol: "start_preparation" -> Current State: S1 -> Next State: S2 [Food Preparation Started]
Step 3: Input symbol: "food_ready"        -> Current State: S2 -> Next State: S3 [Food Prepared]
Step 4: Input symbol: "dispatch"          -> Current State: S3 -> Next State: S4 [Out for Delivery]
Step 5: Input symbol: "deliver"           -> Current State: S4 -> Next State: S5 [Delivered] (FINAL STATE)

STATUS: STRING ACCEPTED BY AUTOMATON M!
Result: w = confirm.start_preparation.food_ready.dispatch.deliver ∈ L(M)
```

---

# PROCEDURE STEPS :
1. Start the MongoDB database service (or rely on the automated in-memory MongoDB fallback).
2. Open the `FoodDelivery-DFA-System` project folder in Visual Studio Code.
3. Open the terminal and run `npm run install:all` to install all dependencies for server and client.
4. Run `npm test` to execute the automated formal verification test suite verifying all 7 DFA mathematical properties.
5. Start the backend and frontend development servers concurrently using `npm run dev`.
6. Open the application in a web browser using the local URL `http://localhost:5173/` or live Vercel URL `https://fooddelivery-dfa-system.vercel.app`.
7. Sign in with demo credentials as customer (`customer@dfafood.com` / `Customer@123`) or restaurant staff (`admin@dfafood.com` / `Admin@123`).
8. Add food items to the cart and place an order to initialize state $S_0$ (Order Created).
9. Open the Live Tracking dashboard (`/track/:id`) to inspect real-time DFA state progression.
10. Open the Kitchen Admin Dashboard (`/admin`) and advance order through valid DFA transitions ($S_0 \to S_1 \to S_2 \to S_3 \to S_4 \to S_5$).
11. Test illegal transitions (such as state-skipping or post-cooking cancellation) to verify that the DFA returns an HTTP 422 error.
12. Navigate to the DFA Visualizer (`/dfa`) to simulate custom symbol strings in the interactive string sequence analyzer.
13. Verify that the final order reaches accepting state $S_5$ (Delivered) and confirms full lifecycle execution.

---

# ADVANTAGES OF USING FLAT CONCEPT IN ONLINE FOOD ORDERING AND DELIVERY TRACKING SYSTEM :
- **Pattern Recognition**: Formally recognizes valid business workflows as regular languages over the operational alphabet $\Sigma$.
- **Automatic Validation**: Validates all operational actions mathematically before executing database state updates.
- **Fast Deterministic Processing**: Evaluates transitions in $O(1)$ time complexity using direct transition matrix lookups.
- **Zero Illegal State Jumping**: Prevents race conditions and API forgery (e.g., jumping from $S_0$ directly to $S_5$).
- **Business Rule Integrity**: Locks customer cancellation once cooking begins by defining $\delta(S_2, \text{cancel}) = \emptyset$, eliminating restaurant food wastage.
- **Terminal State Security**: Guarantees that delivered ($S_5$) and cancelled ($S_6$) orders remain strictly immutable with zero outgoing transitions.
