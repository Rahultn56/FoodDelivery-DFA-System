# Comprehensive Testing & Demonstration Guide

> **Project**: Online Food Ordering and Delivery Tracking System Using DFA  
> **Course Subjects**: Computer Networks (CN), Formal Languages and Automata Theory (FLAT), Full Stack Web Development (FSWD)

This document contains instructions for executing both automated test suites and live manual integration tests for project evaluation and viva examination.

---

## 1. Automated Test Suite (Unit Tests)

The backend includes a formal test suite located in `server/test/orderDfa.test.js` using Node.js's built-in test runner (`node:test` and `node:assert/strict`). It mathematically verifies every property of the DFA.

### How to Run Automated Tests
From the project root:
```bash
npm test
```
*(Or from the `server` directory: `cd server && npm test`)*

### Test Suite Execution Output
```text
> rahul-project1@1.0.0 test
> npm --prefix server test

> rahul-project1-api@1.0.0 test
> node --test

✔ DFA Formal 5-tuple M = (Q, Sigma, delta, q0, F) definition verification (8.5418ms)
✔ Valid transitions delta(q, a) match the formal state transition table (0.6721ms)
✔ Strictly rejects state-skipping and undefined transitions (delta is a partial function) (0.6686ms)
✔ Strictly protects terminal states F = {S5, S6} from any outgoing transitions (0.3802ms)
✔ Rejects unknown states and invalid input alphabet symbols (0.2635ms)
✔ Simulates string sequences w in Sigma* and verifies language membership L(M) (0.5001ms)
✔ getDfaMetadata returns complete mathematical model (0.3829ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 159.1997
```

### Coverage Analysis
| Test Case | Formal Automata Property Tested | Outcome |
| :--- | :--- | :--- |
| **Test 1: 5-Tuple Integrity** | Checks $|Q| = 7$, $|\Sigma| = 6$, $q_0 = S_0$, $F = \{S_5, S_6\}$ | PASS |
| **Test 2: Transition Function $\delta$** | Validates all 7 valid edges in transition table | PASS |
| **Test 3: Partial Function & Skips** | Proves state-skipping (e.g., $S_0 \xrightarrow{\text{dispatch}} \emptyset$) is rejected | PASS |
| **Test 4: Terminal Sink States** | Proves $\delta(S_5, \sigma) = \emptyset$ and $\delta(S_6, \sigma) = \emptyset$ for all $\sigma \in \Sigma$ | PASS |
| **Test 5: Alphabet Membership** | Rejects illegal symbols (e.g. `teleport`, `eat`) and states ($S_{99}$) | PASS |
| **Test 6: Language Membership $L(M)$**| Simulates input strings $w \in \Sigma^*$, testing acceptance / rejection | PASS |
| **Test 7: Metadata Completeness** | Validates API export structure for frontend visualizer | PASS |

---

## 2. Manual End-to-End Walkthrough (Viva Demonstration)

Follow these steps to demonstrate the full application to evaluators:

### Step 1: Start the System
1. Open a terminal and run `npm run dev`.
2. Confirm both services start:
   - Backend API: `http://localhost:4000`
   - Frontend Client: `http://localhost:5173`
3. Notice in the console log that the server automatically started an in-memory database and seeded 12 menu items.

### Step 2: Open Dual Browser Windows
- Open **Window 1 (Customer)** at `http://localhost:5173`.
- Open **Window 2 (Admin)** at `http://localhost:5173/login` in an Incognito / Private window.

### Step 3: Customer Order Placement
1. In Window 1, click **"Sign In"** $\to$ Click the **"👤 Demo Customer"** button for instant one-click login as *Alex Morgan*.
2. Browse the menu. Use the search bar to type `"pizza"`, or toggle **"🌱 Veg Only"**.
3. Click the `+` button on **"Classic Margherita Basil Pizza"** and **"Smash House Double Burger"**.
4. Open the **Bag** in the top right.
5. Click **"Place Order"**.
6. The customer is immediately redirected to the **Live Order Tracking Page** (`/orders/:id`), showing order state **S0 (Order Placed)**.

### Step 4: Admin Kitchen Progression (Real-Time WebSocket Demonstration)
1. In Window 2 (Incognito), click the **"⚙️ Demo Admin"** button for instant login as *Restaurant Admin*.
2. Click **"⚙️ Dashboard"** in the navigation bar.
3. Observe the newly placed order at the top of the **Orders** tab showing status **`Order Created · S0`**.
4. Click **`Accept Order →`** (`confirm` $\to S_1$).
   - Watch Window 1 (Customer): The customer's timeline instantly advances to **`Order Confirmed`** via WebSocket!
5. In Window 2, click **`Start Cooking →`** (`start_preparation` $\to S_2$).
   - Watch Window 1: Advances to **`Preparing Food`**. The cancel button disappears because food is now being cooked!
6. In Window 2, click **`Mark Food Ready →`** (`food_ready` $\to S_3$).
   - Watch Window 1: Advances to **`Food Ready`**.
7. In Window 2, click **`Dispatch →`** (`dispatch` $\to S_4$).
   - Watch Window 1: Advances to **`Out for Delivery`**.
8. In Window 2, click **`Mark Delivered →`** (`deliver` $\to S_5$).
   - Watch Window 1: Advances to **`Delivered!`** (Final state reached).

---

## 3. Invalid Transition Rejection Demonstration (FLAT Enforcement)

To prove to the examiner that the server actively enforces the DFA:

### Scenario A: Illegal State Skipping
1. Open PowerShell or Terminal and attempt to dispatch an order that is still in state $S_0$:
   ```powershell
   $body = '{"action":"dispatch"}'
   Invoke-WebRequest -Uri "http://localhost:4000/api/orders/<ORDER_ID>/transition" `
     -Method PATCH `
     -Headers @{ Authorization="Bearer <ADMIN_TOKEN>" } `
     -ContentType "application/json" `
     -Body $body
   ```
2. **Expected Response**: HTTP `422 Unprocessable Entity`:
   ```json
   {
     "message": "Transition delta(S0, \"dispatch\") is undefined. Current state is S0 (Order Created). Allowed input(s): \"confirm\" or \"cancel\".",
     "currentState": "S0"
   }
   ```

### Scenario B: Modification of Terminal State (Delivered)
1. Attempt to cancel an order that has already been delivered ($S_5$):
   ```powershell
   $body = '{"action":"cancel"}'
   Invoke-WebRequest -Uri "http://localhost:4000/api/orders/<DELIVERED_ORDER_ID>/transition" `
     -Method PATCH `
     -Headers @{ Authorization="Bearer <ADMIN_TOKEN>" } `
     -ContentType "application/json" `
     -Body $body
   ```
2. **Expected Response**: HTTP `422 Unprocessable Entity`:
   ```json
   {
     "message": "Cannot transition from final state \"S5\" (Delivered). Terminal states in F = {S5, S6} have no outgoing transitions."
   }
   ```

---

## 4. Computer Networks Inspector Demonstration

1. In the browser, navigate to `http://localhost:5173/network`.
2. Point out:
   - **Live Server Metrics**: Watch the HTTP request and WebSocket frame counters increment in real-time as you navigate pages.
   - **Active TCP Sockets**: Displays connected socket client count.
   - **HTTP Details**: Displays protocol, version, client origin, host, and port of the current request.
   - **OSI / TCP-IP Model**: Explains how data moves from Layer 7 (Application) down to Layer 1 (Physical).
   - **TCP 3-Way Handshake**: Explains SYN, SYN-ACK, ACK packet exchange.
