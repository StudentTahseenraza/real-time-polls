class FairnessService {
  constructor() {
    this.voteLimits = {
      ip: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 votes per hour per IP
      cookie: { max: 1, windowMs: 24 * 60 * 60 * 1000 }, // 1 vote per 24 hours per cookie
      userAgent: { max: 5, windowMs: 60 * 60 * 1000 } // 5 votes per hour per user agent
    };
  }

  /**
   * Check if a vote passes all fairness checks
   */
  async checkVoteEligibility(poll, { clientIp, visitorId, userAgent }) {
    const checks = {
      ipCheck: this.checkIpBased(poll, clientIp),
      cookieCheck: this.checkCookieBased(poll, visitorId),
      userAgentCheck: this.checkUserAgentBased(poll, userAgent)
    };

    const failedChecks = [];
    
    for (const [checkName, result] of Object.entries(checks)) {
      if (!result.allowed) {
        failedChecks.push({
          check: checkName,
          reason: result.reason,
          retryAfter: result.retryAfter
        });
      }
    }

    return {
      allowed: failedChecks.length === 0,
      failedChecks
    };
  }

  /**
   * IP-based rate limiting check
   */
  checkIpBased(poll, clientIp) {
    const oneHourAgo = new Date(Date.now() - this.voteLimits.ip.windowMs);
    const recentIpVotes = poll.ipAddresses.filter(v => 
      v.ip === clientIp && v.votedAt > oneHourAgo
    ).length;

    if (recentIpVotes >= this.voteLimits.ip.max) {
      return {
        allowed: false,
        reason: `Too many votes from this IP address. Maximum ${this.voteLimits.ip.max} votes per hour.`,
        retryAfter: this.voteLimits.ip.windowMs / (60 * 1000) // in minutes
      };
    }

    return { allowed: true };
  }

  /**
   * Cookie-based tracking check
   */
  checkCookieBased(poll, visitorId) {
    const oneDayAgo = new Date(Date.now() - this.voteLimits.cookie.windowMs);
    const existingCookieVote = poll.cookies.find(v => 
      v.cookieId === visitorId && v.votedAt > oneDayAgo
    );

    if (existingCookieVote) {
      return {
        allowed: false,
        reason: 'You have already voted on this poll. Please wait 24 hours between votes.',
        retryAfter: 24 * 60 // 24 hours in minutes
      };
    }

    return { allowed: true };
  }

  /**
   * User Agent fingerprinting check
   */
  checkUserAgentBased(poll, userAgent) {
    const oneHourAgo = new Date(Date.now() - this.voteLimits.userAgent.windowMs);
    const recentUaVotes = poll.userAgents.filter(v => 
      v.ua === userAgent && v.votedAt > oneHourAgo
    ).length;

    if (recentUaVotes >= this.voteLimits.userAgent.max) {
      return {
        allowed: false,
        reason: 'Suspicious voting pattern detected.',
        retryAfter: this.voteLimits.userAgent.windowMs / (60 * 1000) // in minutes
      };
    }

    return { allowed: true };
  }

  /**
   * Track vote metadata for future checks
   */
  trackVoteMetadata(poll, { clientIp, visitorId, userAgent, optionIndex }) {
    poll.ipAddresses.push({ 
      ip: clientIp, 
      votedAt: new Date(), 
      choice: optionIndex 
    });
    
    poll.cookies.push({ 
      cookieId: visitorId, 
      votedAt: new Date(), 
      choice: optionIndex 
    });
    
    poll.userAgents.push({ 
      ua: userAgent, 
      votedAt: new Date(), 
      choice: optionIndex 
    });

    return poll;
  }

  /**
   * Get vote limits for UI display
   */
  getVoteLimits() {
    return {
      ip: { ...this.voteLimits.ip },
      cookie: { ...this.voteLimits.cookie },
      userAgent: { ...this.voteLimits.userAgent }
    };
  }
}

export default new FairnessService();