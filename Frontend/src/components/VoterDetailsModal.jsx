import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineX, 
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineDesktopComputer,
  HiOutlineUserGroup,
  HiOutlineGlobe,
  HiOutlineCookie,
  HiOutlineChip
} from 'react-icons/hi';

const VoterDetailsModal = ({ isOpen, onClose, voters, options, votersByOption, totalVoters, loading }) => {
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  };

  const getVoterIcon = (voterType) => {
    switch(voterType) {
      case 'IP Address':
        return <HiOutlineGlobe className="text-blue-400" />;
      case 'Browser Cookie':
        return <HiOutlineCookie className="text-yellow-400" />;
      case 'User Agent':
        return <HiOutlineChip className="text-green-400" />;
      default:
        return <HiOutlineUser className="text-purple-400" />;
    }
  };

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Use votersByOption if available, otherwise group manually
  const groupedVoters = votersByOption || {};
  const hasGroupedData = Object.keys(groupedVoters).length > 0;

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
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-gradient-to-br from-purple-600 to-pink-600 py-2 z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <HiOutlineUserGroup className="text-pink-300" />
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
              ) : totalVoters > 0 ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-morphism rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">{totalVoters}</div>
                      <div className="text-white/60 text-sm">Total Voters</div>
                    </div>
                    <div className="glass-morphism rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">
                        {Object.keys(groupedVoters).filter(key => groupedVoters[key].voters.length > 0).length}
                      </div>
                      <div className="text-white/60 text-sm">Options with Votes</div>
                    </div>
                    <div className="glass-morphism rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">
                        {voters.filter(v => v.voterType === 'IP Address').length}
                      </div>
                      <div className="text-white/60 text-sm">Unique IPs</div>
                    </div>
                  </div>

                  {/* Voters by Option */}
                  {hasGroupedData ? (
                    // Use pre-grouped data from API
                    Object.entries(groupedVoters).map(([optionIndex, { optionText, voters }]) => (
                      voters.length > 0 && (
                        <div key={optionIndex} className="glass-morphism rounded-xl p-4">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-lg">
                            <HiOutlineCheckCircle className="text-green-400" />
                            {optionText}
                            <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                              {voters.length} {voters.length === 1 ? 'voter' : 'voters'}
                            </span>
                          </h3>
                          
                          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {voters.map((voter, idx) => (
                              <motion.div
                                key={`${optionIndex}-${idx}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white/5 rounded-lg p-3 flex items-center justify-between text-sm hover:bg-white/10 transition-all"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                                    {getVoterIcon(voter.voterType)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-white font-medium">
                                        {voter.voterType}
                                      </p>
                                      {voter.identifier && (
                                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/70 font-mono">
                                          {voter.identifier}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-white/50 mt-1">
                                      <span className="flex items-center gap-1">
                                        <HiOutlineClock />
                                        {formatTime(voter.votedAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full">
                                    {voter.voterType === 'IP Address' ? '🌐' : '🍪'} {voter.voterType}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )
                    ))
                  ) : (
                    // Fallback: group manually
                    options?.map((optionText, optionIndex) => {
                      const optionVoters = voters.filter(v => v.choice === optionIndex);
                      return optionVoters.length > 0 && (
                        <div key={optionIndex} className="glass-morphism rounded-xl p-4">
                          <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-lg">
                            <HiOutlineCheckCircle className="text-green-400" />
                            {optionText}
                            <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                              {optionVoters.length} {optionVoters.length === 1 ? 'voter' : 'voters'}
                            </span>
                          </h3>
                          
                          <div className="space-y-2">
                            {optionVoters.map((voter, idx) => (
                              <div key={idx} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getVoterIcon(voter.voterType)}
                                  <span className="text-white">{voter.voterType}</span>
                                </div>
                                <span className="text-white/50 text-xs">
                                  {formatTime(voter.votedAt)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Footer Note */}
                  <div className="text-center text-white/40 text-xs pt-4 border-t border-white/10">
                    <p>🕒 Times shown in your local timezone</p>
                    <p className="mt-1">👤 Voter information is anonymized for privacy</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16">
                  <HiOutlineUserGroup className="text-6xl text-white/30 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">No votes yet</p>
                  <p className="text-white/50 text-sm mt-2">Be the first to vote in this poll!</p>
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