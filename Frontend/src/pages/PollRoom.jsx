import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiOutlineLink, 
  HiOutlineCheckCircle, 
  HiOutlineChartBar, 
  HiOutlineArrowLeft,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineShare,
  HiOutlineUserGroup,
  HiOutlineUser,
  HiOutlineClock,
  HiOutlineCog,
  HiOutlineStar
} from 'react-icons/hi';
import ShareModal from '../components/ShareModal';
import VoterDetailsModal from '../components/VoterDetailsModal';

const API_URL ='http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const PollRoom = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVoterDetails, setShowVoterDetails] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [voterDetails, setVoterDetails] = useState([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  useEffect(() => {
    // MULTIPLE WAYS TO CHECK CREATOR STATUS
    const checkCreatorStatus = () => {
      console.log('🔍 Checking creator status for poll:', pollId);
      
      // Method 1: Check navigation state (from creation)
      if (location.state?.isCreator) {
        console.log('✅ Creator detected from navigation state');
        return true;
      }
      
      // Method 2: Check sessionStorage (set during creation)
      const sessionCreator = sessionStorage.getItem(`creator_${pollId}`);
      if (sessionCreator === 'true') {
        console.log('✅ Creator detected from sessionStorage');
        return true;
      }
      
      // Method 3: Check localStorage (creator polls list)
      try {
        const creatorPolls = JSON.parse(localStorage.getItem('creatorPolls') || '[]');
        const isInCreatorList = creatorPolls.some(p => 
          typeof p === 'string' ? p === pollId : p.pollId === pollId
        );
        if (isInCreatorList) {
          console.log('✅ Creator detected from creatorPolls list');
          return true;
        }
      } catch (e) {
        console.error('Error parsing creatorPolls:', e);
      }
      
      // Method 4: Check if user has the creator cookie (backend would need to validate)
      // This is a fallback - you could add an API endpoint to check creator status
      
      console.log('❌ Not a creator (shared view mode)');
      return false;
    };

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Set creator status
    const creatorStatus = checkCreatorStatus();
    setIsCreator(creatorStatus);
    
    // If creator, ensure sessionStorage is set
    if (creatorStatus) {
      sessionStorage.setItem(`creator_${pollId}`, 'true');
    }

    return () => newSocket.close();
  }, [pollId, location.state]);

  useEffect(() => {
    if (socket && pollId) {
      socket.emit('join-poll', pollId);
      
      socket.on('vote-update', (updatedPoll) => {
        console.log('📊 Real-time vote update received');
        setPoll(prev => ({
          ...prev,
          options: updatedPoll.options,
          totalVotes: updatedPoll.totalVotes
        }));
        
        // Show toast for real-time vote
        if (!hasVoted) {
          toast.success('New vote received!', {
            icon: '🗳️',
            duration: 2000
          });
        }
      });

      return () => {
        socket.off('vote-update');
      };
    }
  }, [socket, pollId, hasVoted]);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching poll:', pollId);
      
      const response = await axios.get(`${API_URL}/polls/${pollId}`, {
        withCredentials: true
      });

      console.log('📥 Poll response:', response.data);

      if (response.data.success) {
        setPoll(response.data.data);
        
        // Check if user has voted from localStorage
        const voted = localStorage.getItem(`voted_${pollId}`);
        setHasVoted(!!voted);
      } else {
        toast.error('Poll not found');
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      toast.error(error.response?.data?.error || 'Poll not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchVoterDetails = async () => {
    setLoadingVoters(true);
    try {
      console.log('📡 Fetching voter details for poll:', pollId);
      
      const response = await axios.get(`${API_URL}/polls/${pollId}/voters`, {
        withCredentials: true,
        timeout: 10000
      });

      console.log('📥 Voter details response:', response.data);

      if (response.data.success) {
        setVoterDetails(response.data.data);
        setShowVoterDetails(true);
      }
    } catch (error) {
      console.error('Error fetching voter details:', error);
      
      let errorMessage = 'Failed to load voter details';
      if (error.response?.status === 404) {
        errorMessage = 'Voter details not found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please check your connection.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoadingVoters(false);
    }
  };

  const handleVote = async (optionIndex) => {
    if (hasVoted) {
      toast.error('You have already voted in this poll');
      return;
    }

    setVoting(true);
    try {
      console.log('📤 Voting on poll:', pollId, 'option:', optionIndex);
      
      const response = await axios.post(
        `${API_URL}/polls/${pollId}/vote`,
        { optionIndex },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log('📥 Vote response:', response.data);

      if (response.data.success) {
        setPoll(response.data.data);
        localStorage.setItem(`voted_${pollId}`, 'true');
        setHasVoted(true);
        toast.success('Vote recorded successfully!', {
          icon: '✅',
          duration: 3000
        });
        
        // Show success animation
        const optionElement = document.getElementById(`option-${optionIndex}`);
        if (optionElement) {
          optionElement.classList.add('vote-success');
          setTimeout(() => {
            optionElement.classList.remove('vote-success');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      
      if (error.response?.status === 429) {
        toast.error('Too many votes. Please try again later.');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.error || 'Invalid vote');
      } else {
        toast.error(error.response?.data?.error || 'Failed to vote');
      }
    } finally {
      setVoting(false);
    }
  };

  const calculatePercentage = (votes) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return ((votes / poll.totalVotes) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white/70">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600">
        <div className="text-white text-2xl mb-4">Poll not found</div>
        {isCreator && (
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white flex items-center gap-2 transition-all"
          >
            <HiOutlineArrowLeft />
            Go to Home
          </button>
        )}
      </div>
    );
  }

  const shareUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-3xl p-8"
        >
          {/* Header - Creator gets Back button, Shared users don't */}
          <div className="flex items-center justify-between mb-6">
            {/* Left side - Back button ONLY for creator */}
            <div className="flex items-center gap-4">
              {isCreator ? (
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all group"
                  title="Back to Home"
                >
                  <HiOutlineArrowLeft className="group-hover:animate-pulse" />
                  <span>Back to Home</span>
                </button>
              ) : (
                <div className="px-4 py-2 bg-purple-500/30 rounded-lg text-white/90 text-sm flex items-center gap-2">
                  <HiOutlineEye />
                  <span>You're viewing a shared poll</span>
                </div>
              )}
            </div>

            {/* Right side - Actions for creator */}
            <div className="flex items-center gap-2">
              {isCreator && (
                <>
                  <button
                    onClick={fetchVoterDetails}
                    disabled={loadingVoters}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all disabled:opacity-50"
                    title="View voter details"
                  >
                    {loadingVoters ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiOutlineUserGroup />
                    )}
                    <span className="hidden sm:inline">View Voters</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all"
                    title="Share poll"
                  >
                    <HiOutlineShare />
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Creator Badge - Only visible to creator */}
          {isCreator && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30"
            >
              <HiOutlineCog className="text-yellow-400" />
              <span className="text-yellow-300 text-sm font-medium">Creator Mode • Full Access</span>
              <HiOutlineStar className="text-yellow-400 ml-2" />
            </motion.div>
          )}

          {/* Poll Question */}
          <h1 className="text-3xl font-bold text-white mb-6 text-center neon-glow">
            {poll.question}
          </h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <HiOutlineUsers className="text-2xl mx-auto mb-2 text-pink-300" />
              <div className="text-2xl font-bold text-white">{poll.totalVotes}</div>
              <div className="text-white/60 text-sm">Total Votes</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <HiOutlineChartBar className="text-2xl mx-auto mb-2 text-blue-300" />
              <div className="text-2xl font-bold text-white">{poll.options.length}</div>
              <div className="text-white/60 text-sm">Options</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <HiOutlineClock className="text-2xl mx-auto mb-2 text-green-300" />
              <div className="text-2xl font-bold text-white">
                {new Date(poll.createdAt).toLocaleDateString()}
              </div>
              <div className="text-white/60 text-sm">Created</div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <AnimatePresence>
              {poll.options.map((option, index) => {
                const percentage = calculatePercentage(option.votes);
                
                return (
                  <motion.div
                    key={index}
                    id={`option-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <motion.button
                      onClick={() => handleVote(index)}
                      disabled={voting || hasVoted}
                      className="w-full text-left relative overflow-hidden group"
                      whileHover={{ scale: hasVoted ? 1 : 1.02 }}
                      whileTap={{ scale: hasVoted ? 1 : 0.98 }}
                    >
                      <div className="relative z-10 glass-morphism rounded-xl p-4 hover:bg-white/20 transition-all">
                        <div className="flex items-center justify-between text-white mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{option.text}</span>
                            {option.votes > 0 && (
                              <motion.span 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full"
                              >
                                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                              </motion.span>
                            )}
                          </div>
                          <span className="font-bold">
                            {option.votes} ({percentage}%)
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full relative"
                          >
                            {option.votes > 0 && (
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"
                              />
                            )}
                          </motion.div>
                        </div>

                        {/* Voter Preview (only for creator) */}
                        {isCreator && option.votes > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-white/60">
                            <HiOutlineUser className="text-white/40" />
                            <span>{option.votes} people voted for this option</span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Voted Message */}
          {hasVoted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-center"
            >
              <p className="text-white flex items-center justify-center gap-2">
                <HiOutlineCheckCircle className="text-green-400" />
                You have already voted in this poll
              </p>
            </motion.div>
          )}

          {/* View Votes Button (for shared users) - Shows even after voting */}
          {!isCreator && poll.totalVotes > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <button
                onClick={fetchVoterDetails}
                disabled={loadingVoters}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white inline-flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {loadingVoters ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HiOutlineEye />
                )}
                {loadingVoters ? 'Loading...' : 'View Vote Details'}
              </button>
            </motion.div>
          )}

          {/* Live Activity Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center justify-center gap-2 text-white/40 text-sm"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live • {poll.totalVotes} {poll.totalVotes === 1 ? 'person has' : 'people have'} voted</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Share Modal - Only for creator */}
      {isCreator && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          pollId={poll.pollId}
          question={poll.question}
          shareUrl={shareUrl}
        />
      )}

      {/* Voter Details Modal */}
      <VoterDetailsModal
        isOpen={showVoterDetails}
        onClose={() => setShowVoterDetails(false)}
        voters={voterDetails?.voters || []}
        options={poll?.options?.map(opt => opt.text) || []}
        votersByOption={voterDetails?.votersByOption || {}}
        totalVoters={voterDetails?.totalVoters || 0}
        loading={loadingVoters}
      />
    </div>
  );
};

export default PollRoom;