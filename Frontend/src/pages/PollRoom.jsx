import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { HiOutlineLink, HiOutlineCheckCircle, HiOutlineChartBar, HiOutlineArrowLeft } from 'react-icons/hi';

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

  useEffect(() => {
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
        
        // Check if user has voted in this session
        const voted = localStorage.getItem(`voted_${pollId}`);
        setHasVoted(!!voted);
      } else {
        toast.error('Poll not found');
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (error) {
      console.error('Error fetching poll:', error);
      toast.error(error.response?.data?.error || 'Poll not found');
      setTimeout(() => navigate('/'), 3000);
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
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-white flex items-center gap-2 transition-all"
        >
          <HiOutlineArrowLeft />
          Go to Home
        </button>
      </div>
    );
  }

  const shareUrl = window.location.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-3xl p-8"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all"
          >
            <HiOutlineArrowLeft />
            Back to Home
          </button>

          {/* Share Link */}
          <div className="mb-8">
            <label className="block text-white mb-2 font-medium">
              Share this poll
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none"
              />
              <CopyToClipboard text={shareUrl} onCopy={() => {
                setCopied(true);
                toast.success('Link copied!');
                setTimeout(() => setCopied(false), 2000);
              }}>
                <motion.button
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {copied ? <HiOutlineCheckCircle /> : <HiOutlineLink />}
                </motion.button>
              </CopyToClipboard>
            </div>
          </div>

          {/* Poll Question */}
          <h1 className="text-3xl font-bold text-white mb-6 text-center neon-glow">
            {poll.question}
          </h1>

          {/* Poll ID */}
          <div className="text-center text-white/60 mb-4 text-sm">
            Poll ID: {poll.pollId}
          </div>

          {/* Total Votes */}
          <div className="flex items-center justify-center gap-2 text-white/70 mb-8">
            <HiOutlineChartBar />
            <span>{poll.totalVotes} total votes</span>
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
                          <span className="font-medium">{option.text}</span>
                          <span className="font-bold">
                            {option.votes} ({percentage}%)
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                          />
                        </div>
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
        </motion.div>
      </div>
    </div>
  );
};

export default PollRoom;