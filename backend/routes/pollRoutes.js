import express from 'express';
import { body, param } from 'express-validator';
import pollController from '../controllers/pollController.js';
import voteController from '../controllers/voteController.js';
import { voteRateLimiter, createPollLimiter } from '../middleware/rateLimiter.js';
import { validatePollCreation } from '../middleware/validation.js';

const router = express.Router();

// Poll creation route
router.post(
  '/create',
  createPollLimiter,
  validatePollCreation,
  pollController.createPoll.bind(pollController)
);

// Get user's poll history
router.get(
  '/history',
  pollController.getUserPollHistory.bind(pollController)
);

// Get all polls (with pagination and search)
router.get(
  '/',
  pollController.getAllPolls.bind(pollController)
);

// Get single poll
router.get(
  '/:pollId',
  param('pollId').isString().isLength({ min: 8, max: 8 }),
  pollController.getPoll.bind(pollController)
);

// Delete a poll
router.delete(
  '/:pollId',
  param('pollId').isString().isLength({ min: 8, max: 8 }),
  pollController.deletePoll.bind(pollController)
);

// Vote on a poll
router.post(
  '/:pollId/vote',
  voteRateLimiter,
  [
    param('pollId').isString().isLength({ min: 8, max: 8 }),
    body('optionIndex').isInt({ min: 0 })
  ],
  voteController.vote.bind(voteController)
);

// Check vote status
router.get(
  '/:pollId/vote-status',
  param('pollId').isString().isLength({ min: 8, max: 8 }),
  voteController.checkVoteStatus.bind(voteController)
);

// Get vote statistics
router.get(
  '/:pollId/stats',
  param('pollId').isString().isLength({ min: 8, max: 8 }),
  voteController.getVoteStats.bind(voteController)
);

export default router;