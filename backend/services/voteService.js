import pollService from './pollService.js';
import fairnessService from './fairnessService.js';

class VoteService {
  /**
   * Process a vote with all fairness checks
   */
  async processVote(pollId, optionIndex, voterInfo) {
    try {
      // Get poll with sensitive data for checks
      const poll = await pollService.getPollById(pollId, true);
      
      if (!poll) {
        throw new Error('Poll not found');
      }

      // Validate option index
      if (!this.isValidOption(poll, optionIndex)) {
        throw new Error('Invalid option index');
      }

      // Run fairness checks
      const eligibility = await fairnessService.checkVoteEligibility(poll, voterInfo);
      
      if (!eligibility.allowed) {
        return {
          success: false,
          errors: eligibility.failedChecks,
          statusCode: 429
        };
      }

      // Update vote count
      const updatedPoll = await pollService.updatePollVote(poll, optionIndex);

      // Track metadata for future checks
      fairnessService.trackVoteMetadata(poll, {
        ...voterInfo,
        optionIndex
      });

      // Save all changes
      await poll.save();

      return {
        success: true,
        data: pollService.sanitizePollData(updatedPoll),
        statusCode: 200
      };
    } catch (error) {
      throw new Error(`Vote processing failed: ${error.message}`);
    }
  }

  /**
   * Validate if option index is valid
   */
  isValidOption(poll, optionIndex) {
    return optionIndex >= 0 && optionIndex < poll.options.length;
  }

  /**
   * Get vote statistics for a poll
   */
  getVoteStats(poll) {
    const total = poll.totalVotes;
    const optionStats = poll.options.map(option => ({
      text: option.text,
      votes: option.votes,
      percentage: total > 0 ? ((option.votes / total) * 100).toFixed(1) : 0
    }));

    return {
      total,
      options: optionStats,
      timestamp: new Date()
    };
  }

  /**
   * Check if user has already voted based on cookie
   */
  hasUserVoted(poll, visitorId) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return poll.cookies.some(v => 
      v.cookieId === visitorId && v.votedAt > oneDayAgo
    );
  }
}

export default new VoteService();