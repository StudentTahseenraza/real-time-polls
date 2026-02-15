import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { 
  HiOutlineLink, 
  HiOutlineCheckCircle, 
  HiOutlineChartBar, 
  HiOutlineArrowLeft,
  HiOutlineUsers,
  HiOutlineEye,
  HiOutlineShare
} from 'react-icons/hi';
import ShareModal from '../components/ShareModal';

// const API_URL = 'http://localhost:5000/api';
// const SOCKET_URL = 'http://localhost:5000';
const SOCKET_URL = 'https://real-time-polls.onrender.com';
const API_URL = 'https://real-time-polls.onrender.com/api';



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
  const [isSharedView, setIsSharedView] = useState(false);
  const [liveVoters, setLiveVoters] = useState({});

  useEffect(() => {
    // Check if user came from shared link
    const referrer = document.referrer;
    const isShared = !referrer.includes(window.location.origin) && referrer !== '';
    setIsSharedView(isShared);

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket && pollId) {
      socket.emit('join-poll', pollId);
      
      socket.on('vote-update', (updatedPoll) => {
        console.log('Received vote update:', updatedPoll);
        setPoll(prev => ({
          ...prev,
          options: updatedPoll.options,
          totalVotes: updatedPoll.totalVotes
        }));

        // Update live voters count
        const voters = {};
        updatedPoll.options.forEach((opt, idx) => {
          voters[idx] = opt.votes;
        });
        setLiveVoters(voters);
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
      console.log('Fetching poll:', pollId);
      
      const response = await axios.get(`${API_URL}/polls/${pollId}`, {
        withCredentials: true
      });

      console.log('Poll response:', response.data);

      if (response.data.success) {
        setPoll(response.data.data);
        
        // Initialize live voters
        const voters = {};
        response.data.data.options.forEach((opt, idx) => {
          voters[idx] = opt.votes;
        });
        setLiveVoters(voters);
        
        // Check if user has voted in this session
        const voted = localStorage.getItem(`voted_${pollId}`);
        setHasVoted(!!voted);
      } else {
        toast.error('Poll not found');
        if (!isSharedView) {
          setTimeout(() => navigate('/'), 3000);
        }
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      toast.error(error.response?.data?.error || 'Poll not found');
      if (!isSharedView) {
        setTimeout(() => navigate('/'), 3000);
      }
    } finally {
      setLoading(false);
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

      console.log('Vote response:', response.data);

      if (response.data.success) {
        setPoll(response.data.data);
        localStorage.setItem(`voted_${pollId}`, 'true');
        setHasVoted(true);
        
        // Update live voters
        const voters = {};
        response.data.data.options.forEach((opt, idx) => {
          voters[idx] = opt.votes;
        });
        setLiveVoters(voters);
        
        toast.success('Vote recorded successfully!');
      } else {
        toast.error(response.data.error || 'Failed to vote');
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
        {!isSharedView && (
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
  const totalVoters = Object.values(liveVoters).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-3xl p-8"
        >
          {/* Header - Conditional based on shared view */}
          <div className="flex items-center justify-between mb-6">
            {!isSharedView ? (
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all group"
              >
                <HiOutlineArrowLeft className="group-hover:animate-pulse" />
                <span>Back to Home</span>
              </button>
            ) : (
              <div className="px-4 py-2 bg-white/10 rounded-lg text-white/80 text-sm">
                <HiOutlineEye className="inline mr-2" />
                Viewing Shared Poll
              </div>
            )}
            
            {/* Share Button - Only show to non-shared viewers */}
            {!isSharedView && (
              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all"
              >
                <HiOutlineShare />
                Share Poll
              </button>
            )}
          </div>

          {/* Poll Question */}
          <h1 className="text-3xl font-bold text-white mb-6 text-center neon-glow">
            {poll.question}
          </h1>

          {/* Live Voter Count */}
          <div className="flex items-center justify-center gap-4 text-white/70 mb-6">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <HiOutlineUsers className="text-pink-300" />
              <span className="font-medium">{totalVoters} total {totalVoters === 1 ? 'vote' : 'votes'}</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <AnimatePresence>
              {poll.options.map((option, index) => {
                const percentage = calculatePercentage(option.votes);
                const currentVotes = liveVoters[index] || 0;
                
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
                            {currentVotes > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full"
                              >
                                {currentVotes} {currentVotes === 1 ? 'voter' : 'voters'}
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
                            {/* Live indicator */}
                            {currentVotes > 0 && (
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

                        {/* Live Vote Counter Animation */}
                        {currentVotes > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-2 text-xs text-white/60 flex items-center gap-1"
                          >
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                            <span>{currentVotes} people voted for this option</span>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

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

          {/* Live Activity Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 flex items-center justify-center gap-2 text-white/40 text-sm"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live • {totalVoters} people have voted</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Share Modal - Only for non-shared viewers */}
      {!isSharedView && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          pollId={poll.pollId}
          question={poll.question}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
};

export default PollRoom;