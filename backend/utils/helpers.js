/**
 * Format response data consistently
 */
export const formatResponse = (success, data = null, error = null) => {
  return {
    success,
    ...(data && { data }),
    ...(error && { error })
  };
};

/**
 * Generate a random color for UI
 */
export const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#D4A5A5', '#9B59B6', '#3498DB',
    '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Calculate time remaining until next vote
 */
export const getTimeUntilNextVote = (lastVoteTime, cooldownHours = 24) => {
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const nextVoteTime = new Date(lastVoteTime.getTime() + cooldownMs);
  const now = new Date();
  
  if (now >= nextVoteTime) {
    return null;
  }
  
  const diffMs = nextVoteTime - now;
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
  
  return { hours, minutes };
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate URL
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Sleep utility for testing
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));