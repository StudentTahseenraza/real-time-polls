import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineX, 
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineDesktopComputer
} from 'react-icons/hi';

const VoterDetailsModal = ({ isOpen, onClose, voters, options, loading }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  };

  const getOptionText = (choiceIndex) => {
    return options[choiceIndex]?.text || 'Unknown option';
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Group voters by option
  const votersByOption = {};
  if (voters && voters.length > 0) {
    voters.forEach(voter => {
      const optionText = getOptionText(voter.choice);
      if (!votersByOption[optionText]) {
        votersByOption[optionText] = [];
      }
      votersByOption[optionText].push(voter);
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={handleModalClick}
              className="w-full max-w-4xl bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 m-4"
              style={{
                maxHeight: '80vh',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-gradient-to-br from-purple-600 to-pink-600 py-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <HiOutlineUserGroup />
                  Voter Details
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <HiOutlineX className="text-white text-xl" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
                  <p className="text-white/70 mt-4">Loading voter details...</p>
                </div>
              ) : voters && voters.length > 0 ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="glass-morphism rounded-xl p-4">
                    <p className="text-white/80">
                      Total Voters: <span className="text-white font-bold">{voters.length}</span>
                    </p>
                  </div>

                  {/* Voters by Option */}
                  {Object.entries(votersByOption).map(([optionText, optionVoters]) => (
                    <div key={optionText} className="glass-morphism rounded-xl p-4">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <HiOutlineCheckCircle className="text-green-400" />
                        {optionText}
                        <span className="text-sm text-white/60 ml-2">
                          ({optionVoters.length} {optionVoters.length === 1 ? 'voter' : 'voters'})
                        </span>
                      </h3>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                        {optionVoters.map((voter, idx) => (
                          <div
                            key={idx}
                            className="bg-white/5 rounded-lg p-3 flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                <HiOutlineUser className="text-white" />
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  Voter {voter.voterId ? voter.voterId.substring(0, 8) : `#${idx + 1}`}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-white/50">
                                  <span className="flex items-center gap-1">
                                    <HiOutlineClock />
                                    {formatTime(voter.votedAt)}
                                  </span>
                                  {voter.ip && (
                                    <span className="flex items-center gap-1">
                                      <HiOutlineDesktopComputer />
                                      IP: {voter.ip.split(':')[0]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {voter.isAnonymous ? (
                              <span className="text-xs bg-purple-500/30 px-2 py-1 rounded-full text-purple-300">
                                Anonymous
                              </span>
                            ) : (
                              <span className="text-xs bg-green-500/30 px-2 py-1 rounded-full text-green-300">
                                Verified
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Footer Note */}
                  <p className="text-white/40 text-xs text-center">
                    * Voter IDs are anonymized for privacy
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <HiOutlineUserGroup className="text-6xl text-white/30 mx-auto mb-4" />
                  <p className="text-white/70">No votes yet</p>
                  <p className="text-white/50 text-sm mt-2">Be the first to vote!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VoterDetailsModal;