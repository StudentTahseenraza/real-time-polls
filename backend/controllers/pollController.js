import pollService from '../services/pollService.js';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

class PollController {
  /**
   * Create a new poll
   */
  async createPoll(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { question, options } = req.body;
      
      // Clean options
      const cleanedOptions = options
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);

      if (cleanedOptions.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'At least 2 valid options are required'
        });
      }

      const poll = await pollService.createPoll(question, cleanedOptions);

      // Set a cookie for the creator
      const visitorId = this.setVisitorCookie(res);

      // Store poll in user's history (using cookie)
      this.addPollToUserHistory(res, poll.pollId, question);

      console.log('✅ Poll created:', poll.pollId);

      res.status(201).json({
        success: true,
        data: {
          pollId: poll.pollId,
          question: poll.question,
          shareableLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/poll/${poll.pollId}`,
          createdAt: poll.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating poll:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create poll: ' + error.message 
      });
    }
  }

  /**
   * Get poll details
   */
  async getPoll(req, res) {
    try {
      const { pollId } = req.params;
      
      console.log('🔍 Fetching poll:', pollId);

      const poll = await pollService.getPollById(pollId);

      if (!poll) {
        console.log('❌ Poll not found:', pollId);
        return res.status(404).json({ 
          success: false,
          error: 'Poll not found' 
        });
      }

      console.log('✅ Poll found:', pollId);

      res.json({
        success: true,
        data: poll
      });
    } catch (error) {
      console.error('Error fetching poll:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch poll' 
      });
    }
  }

  /**
   * Get all polls (with pagination)
   */
  async getAllPolls(req, res) {
    try {
      const { limit = 50, page = 1, search = '' } = req.query;
      const polls = await pollService.getAllPolls(parseInt(limit), search);
      
      res.json({
        success: true,
        data: polls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: polls.length
        }
      });
    } catch (error) {
      console.error('Error fetching polls:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch polls' 
      });
    }
  }

  /**
   * Get user's poll history based on cookies
   */
  async getUserPollHistory(req, res) {
    try {
      const visitorId = req.cookies.poll_visitor;
      
      if (!visitorId) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Get poll history from cookie
      const pollHistory = req.cookies.poll_history ? JSON.parse(req.cookies.poll_history) : [];
      
      // Fetch full poll details for each poll in history
      const polls = await Promise.all(
        pollHistory.slice(0, 20).map(async (item) => {
          const poll = await pollService.getPollById(item.pollId);
          if (poll) {
            return {
              ...poll,
              viewedAt: item.viewedAt,
              question: item.question || poll.question
            };
          }
          return null;
        })
      );

      // Filter out null values (deleted polls)
      const validPolls = polls.filter(p => p !== null);

      res.json({
        success: true,
        data: validPolls
      });
    } catch (error) {
      console.error('Error fetching user poll history:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch poll history' 
      });
    }
  }

  /**
   * Delete a poll
   */
  async deletePoll(req, res) {
    try {
      const { pollId } = req.params;
      const visitorId = req.cookies.poll_visitor;

      const poll = await pollService.getPollById(pollId, true);
      
      if (!poll) {
        return res.status(404).json({ 
          success: false,
          error: 'Poll not found' 
        });
      }

      // Optional: Add authentication check here
      // For now, allow deletion (in production, you'd want to verify ownership)

      await pollService.deletePoll(pollId);

      console.log('🗑️ Poll deleted:', pollId);

      res.json({
        success: true,
        message: 'Poll deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting poll:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to delete poll' 
      });
    }
  }

  /**
   * Add poll to user history
   */
  addPollToUserHistory(res, pollId, question) {
    try {
      // Get existing history
      let pollHistory = [];
      
      // Try to parse existing cookie
      if (res.req?.cookies?.poll_history) {
        try {
          pollHistory = JSON.parse(res.req.cookies.poll_history);
        } catch (e) {
          console.error('Error parsing poll history:', e);
        }
      }

      // Add new poll to history (avoid duplicates)
      const existingIndex = pollHistory.findIndex(item => item.pollId === pollId);
      const newEntry = {
        pollId,
        question: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
        viewedAt: new Date().toISOString()
      };

      if (existingIndex !== -1) {
        pollHistory[existingIndex] = newEntry;
      } else {
        pollHistory.unshift(newEntry);
      }

      // Keep only last 50 polls
      pollHistory = pollHistory.slice(0, 50);

      // Set cookie
      res.cookie('poll_history', JSON.stringify(pollHistory), {
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        httpOnly: false, // Allow JavaScript access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    } catch (error) {
      console.error('Error adding poll to history:', error);
    }
  }

  /**
   * Set visitor cookie
   */
  setVisitorCookie(res) {
    const visitorId = uuidv4();
    res.cookie('poll_visitor', visitorId, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    return visitorId;
  }

  /**
   * Get or create visitor cookie
   */
  getOrCreateVisitorCookie(req, res) {
    let visitorId = req.cookies.poll_visitor;
    if (!visitorId) {
      visitorId = this.setVisitorCookie(res);
    }
    return visitorId;
  }

  /**
 * Get voter details for a poll
 */
async getVoterDetails(req, res) {
  try {
    const { pollId } = req.params;
    
    const poll = await Poll.findOne({ pollId });
    
    if (!poll) {
      return res.status(404).json({ 
        success: false,
        error: 'Poll not found' 
      });
    }

    // Combine voter data from different sources
    const voters = [];
    
    // Add IP-based voters
    poll.ipAddresses.forEach((v, index) => {
      voters.push({
        voterId: `ip_${index + 1}`,
        choice: v.choice,
        votedAt: v.votedAt,
        ip: v.ip,
        method: 'IP',
        isAnonymous: true
      });
    });

    // Add cookie-based voters
    poll.cookies.forEach((v, index) => {
      voters.push({
        voterId: `cookie_${v.cookieId.substring(0, 8)}`,
        choice: v.choice,
        votedAt: v.votedAt,
        method: 'Cookie',
        isAnonymous: true
      });
    });

    // Sort by vote time (newest first)
    voters.sort((a, b) => new Date(b.votedAt) - new Date(a.votedAt));

    res.json({
      success: true,
      data: voters,
      total: voters.length
    });
  } catch (error) {
    console.error('Error fetching voter details:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch voter details' 
    });
  }
}

}

export default new PollController();