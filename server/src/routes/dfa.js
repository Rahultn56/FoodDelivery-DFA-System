import { Router } from 'express';
import { getDfaMetadata, simulateString, transition, STATES, ALPHABET } from '../dfa/orderDfa.js';

const router = Router();

/**
 * GET /api/dfa/info
 * Returns the complete formal 5-tuple definition of M = (Q, Sigma, delta, q0, F)
 */
router.get('/info', (req, res) => {
  res.json(getDfaMetadata());
});

/**
 * POST /api/dfa/simulate
 * Simulates an input sequence on the automaton and returns acceptance/rejection proof
 */
router.post('/simulate', (req, res) => {
  const { sequence } = req.body;
  if (!Array.isArray(sequence)) {
    return res.status(400).json({
      message: 'Body parameter "sequence" must be an array of input alphabet symbols.'
    });
  }

  const result = simulateString(sequence);
  res.json(result);
});

/**
 * POST /api/dfa/test-step
 * Tests a single transition delta(state, action)
 */
router.post('/test-step', (req, res) => {
  const { state, action } = req.body;
  if (!state || !action) {
    return res.status(400).json({ message: 'Both "state" and "action" parameters are required.' });
  }

  const result = transition(state, action);
  res.json(result);
});

export default router;
