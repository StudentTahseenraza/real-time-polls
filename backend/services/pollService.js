import Poll from '../models/Poll.js';
import { v4 as uuidv4 } from 'uuid';

class PollService {
  /**
   * Create a new poll
   */
  async createPoll(question, options) {
    try {
      const pollId = this.generatePollId();
      
      const poll = new Poll({
        pollId,
        question,
        options: options.map(opt => ({ 
          text: opt.trim(), 
          votes: 0 
        }))
      });

      await poll.save();
      return poll;
    } catch (error) {
      throw new Error(`Failed to create poll: ${error.message}`);
    }
  }

  /**
   * Get poll by ID
   */
  async getPollById(pollId, includeSensitive = false) {
    try {
      const poll = await Poll.findOne({ pollId });
      
      if (!poll) {
        return null;
      }

      if (!includeSensitive) {
        return this.sanitizePollData(poll);
      }

      return poll;
    } catch (error) {
      throw new Error(`Failed to fetch poll: ${error.message}`);
    }
  }

  /**
   * Update poll with new vote
   */
  async updatePollVote(poll, optionIndex) {
    try {
      poll.options[optionIndex].votes += 1;
      poll.totalVotes += 1;
      
      await poll.save();
      return poll;
    } catch (error) {
      throw new Error(`Failed to update vote: ${error.message}`);
    }
  }

  /**
   * Get all polls with optional search
   */
  async getAllPolls(limit = 50, search = '') {
    try {
      let query = {};
      
      if (search) {
        query.question = { $regex: search, $options: 'i' };
      }

      const polls = await Poll.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);
      
      return polls.map(poll => this.sanitizePollData(poll));
    } catch (error) {
      throw new Error(`Failed to fetch polls: ${error.message}`);
    }
  }

  /**
   * Delete a poll
   */
  async deletePoll(pollId) {
    try {
      const result = await Poll.deleteOne({ pollId });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete poll: ${error.message}`);
    }
  }

  /**
   * Delete expired polls
   */
  async deleteExpiredPolls() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await Poll.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
      return result.deletedCount;
    } catch (error) {
      throw new Error(`Failed to delete expired polls: ${error.message}`);
    }
  }

  /**
   * Generate unique poll ID
   */
  generatePollId() {
    return uuidv4().substring(0, 8);
  }

  /**
   * Sanitize poll data by removing sensitive information
   */
  sanitizePollData(poll) {
    return {
      pollId: poll.pollId,
      question: poll.question,
      options: poll.options,
      totalVotes: poll.totalVotes,
      createdAt: poll.createdAt
    };
  }
}

export default new PollService();