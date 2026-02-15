import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  HiOutlineCog
} from 'react-icons/hi';
import ShareModal from '../components/ShareModal';
import VoterDetailsModal from '../components/VoterDetailsModal';

// const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';


const API_URL = 'https://real-time-polls.onrender.com/api';
const SOCKET_URL = 'https://real-time-polls.onrender.com';

const PollRoom = () => {
  const { pollId } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [socket, setSocket] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVoterDetails, setShowVoterDetails] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [voterDetails, setVoterDetails] = useState([]);
  const [loadingVoters, setLoadingVoters] = useState(false);

  useEffect(() => {
    // Check if user is the creator (has creator cookie or came from home)
    const checkCreatorStatus = () => {
      // You can set a creator flag in localStorage when creating the poll
      const creatorPolls = JSON.parse(localStorage.getItem('creatorPolls') || '[]');
      setIsCreator(creatorPolls.includes(pollId));
    };

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    checkCreatorStatus();

    return () => newSocket.close();
  }, [pollId]);

  useEffect(() => {
    if (socket && pollId) {
      socket.emit('join-poll', pollId);
      
      socket.on('vote-update', (updatedPoll) => {
        setPoll(prev => ({
          ...prev,
          options: updatedPoll.options,
          totalVotes: updatedPoll.totalVotes
        }));
      });

      return () => {
        socket.off('vote-update');
      };
    }
  }, [socket, pollId]);

  useEffect(() => {
    if (pollId) {
      fetchPoll();
    }
  }, [pollId]);

  const fetchPoll = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/polls/${pollId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setPoll(response.data.data);
        
        // Check if user has voted
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
      const response = await axios.get(`${API_URL}/polls/${pollId}/voters`, {
        withCredentials: true
      });

      if (response.data.success) {
        setVoterDetails(response.data.data);
        setShowVoterDetails(true);
      }
    } catch (error) {
      console.error('Error fetching voter details:', error);
      toast.error('Failed to load voter details');
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
      const response = await axios.post(
        `${API_URL}/polls/${pollId}/vote`,
        { optionIndex },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPoll(response.data.data);
        localStorage.setItem(`voted_${pollId}`, 'true');
        setHasVoted(true);
        toast.success('Vote recorded successfully!');
      }
    } catch (error) {
      console.error('Error voting:', error);
      toast.error(error.response?.data?.error || 'Failed to vote');
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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-white border-t-transparent rounded-full"
        />
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
          {/* Header - Different for Creator vs Shared View */}
          <div className="flex items-center justify-between mb-6">
            {/* Left side - Back button ONLY for creator */}
            <div className="flex items-center gap-4">
              {isCreator ? (
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all group"
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

            {/* Right side - Share button ONLY for creator */}
            <div className="flex items-center gap-2">
              {isCreator && (
                <>
                  <button
                    onClick={fetchVoterDetails}
                    disabled={loadingVoters}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all"
                  >
                    <HiOutlineUserGroup />
                    <span>View Voters</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all"
                  >
                    <HiOutlineShare />
                    Share Poll
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Creator Badge */}
          {isCreator && (
            <div className="mb-4 inline-block px-3 py-1 bg-yellow-500/30 rounded-full text-yellow-300 text-xs flex items-center gap-1">
              <HiOutlineCog />
              <span>Creator Mode • Full Access</span>
            </div>
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
                              <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full">
                                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                              </span>
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
                            className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                          />
                        </div>

                        {/* Voter Avatars Preview (for creator) */}
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

          {/* View Votes Button (for shared users) */}
          {!isCreator && poll.totalVotes > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 text-center"
            >
              <button
                onClick={fetchVoterDetails}
                disabled={loadingVoters}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white inline-flex items-center gap-2 transition-all"
              >
                <HiOutlineEye />
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
            <span>Live • {poll.totalVotes} people have voted</span>
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
        voters={voterDetails}
        options={poll?.options || []}
        loading={loadingVoters}
      />
    </div>
  );
};

export default PollRoom;



