import voteService from '../services/voteService.js';
import pollService from '../services/pollService.js'; // Add this import
import pollController from './pollController.js';
import { validationResult } from 'express-validator';

class VoteController {
  /**
   * Vote on a poll
   */
  async vote(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { pollId } = req.params;
      const { optionIndex } = req.body;
      
      // Get voter information
      const voterInfo = this.getVoterInfo(req, res);
      
      // Process the vote
      const result = await voteService.processVote(
        pollId, 
        optionIndex, 
        voterInfo
      );

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          errors: result.errors
        });
      }

      // Emit real-time update
      req.io.to(`poll-${pollId}`).emit('vote-update', result.data);

      res.json({
        success: true,
        data: result.data,
        message: 'Vote recorded successfully'
      });
    } catch (error) {
      console.error('Error voting:', error);
      
      if (error.message === 'Poll not found') {
        return res.status(404).json({ 
          success: false,
          error: 'Poll not found' 
        });
      }
      
      if (error.message === 'Invalid option index') {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid option selected' 
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Failed to record vote' 
      });
    }
  }

  /**
   * Get voter information from request
   */
  getVoterInfo(req, res) {
    return {
      clientIp: req.ip || req.connection.remoteAddress,
      visitorId: pollController.getOrCreateVisitorCookie(req, res),
      userAgent: req.get('User-Agent')
    };
  }

  /**
   * Check if user has already voted
   */
  async checkVoteStatus(req, res) {
    try {
      const { pollId } = req.params;
      const visitorId = req.cookies.poll_visitor;
      
      if (!visitorId) {
        return res.json({
          success: true,
          data: { hasVoted: false }
        });
      }

      const poll = await pollService.getPollById(pollId, true);
      
      if (!poll) {
        return res.status(404).json({ 
          success: false,
          error: 'Poll not found' 
        });
      }

      const hasVoted = voteService.hasUserVoted(poll, visitorId);

      res.json({
        success: true,
        data: { hasVoted }
      });
    } catch (error) {
      console.error('Error checking vote status:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to check vote status' 
      });
    }
  }

  /**
   * Get vote statistics
   */
  async getVoteStats(req, res) {
    try {
      const { pollId } = req.params;
      
      const poll = await pollService.getPollById(pollId, true);
      
      if (!poll) {
        return res.status(404).json({ 
          success: false,
          error: 'Poll not found' 
        });
      }

      const stats = voteService.getVoteStats(poll);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching vote stats:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch vote statistics' 
      });
    }
  }
}

export default new VoteController();