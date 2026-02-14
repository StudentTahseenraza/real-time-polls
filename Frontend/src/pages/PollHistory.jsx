import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineShare,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineChartBar,
  HiOutlineArrowLeft
} from 'react-icons/hi';
import ShareModal from '../components/ShareModal';

const API_URL = 'https://real-time-polls.onrender.com/api';

const PollHistory = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchPollHistory();
  }, []);

  const fetchPollHistory = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get(`${API_URL}/polls/history`, {
        withCredentials: true
      });

      if (response.data.success) {
        setPolls(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching poll history:', error);
      toast.error('Failed to load poll history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeletePoll = async (pollId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(pollId);
      const response = await axios.delete(`${API_URL}/polls/${pollId}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setPolls(polls.filter(p => p.pollId !== pollId));
        toast.success('Poll deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast.error('Failed to delete poll');
    } finally {
      setDeleting(null);
    }
  };

  const handleShare = (poll, e) => {
    e.stopPropagation();
    setSelectedPoll(poll);
    setShowShareModal(true);
  };

  const filteredPolls = polls.filter(poll =>
    poll.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-morphism rounded-3xl p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <HiOutlineArrowLeft className="text-white text-xl" />
              </button>
              <h1 className="text-3xl font-bold text-white neon-glow">
                Poll History
              </h1>
            </div>
            <button
              onClick={fetchPollHistory}
              disabled={refreshing}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <HiOutlineRefresh className={`${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
              <input
                type="text"
                placeholder="Search polls by question..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          </div>

          {/* Polls Grid */}
          {filteredPolls.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-white/50 text-6xl mb-4">📊</div>
              <p className="text-white/70 text-lg mb-4">No polls found in history</p>
              <button
                onClick={() => navigate('/create')}
                className="px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Create Your First Poll
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredPolls.map((poll, index) => (
                  <motion.div
                    key={poll.pollId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="glass-morphism rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => navigate(`/poll/${poll.pollId}`)}
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <HiOutlineClock />
                          <span>{formatDate(poll.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleShare(poll, e)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Share poll"
                          >
                            <HiOutlineShare className="text-white" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePoll(poll.pollId, e)}
                            disabled={deleting === poll.pollId}
                            className="p-2 hover:bg-red-500/30 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Delete poll"
                          >
                            <HiOutlineTrash className="text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Question */}
                      <h3 className="text-white font-semibold text-lg mb-3 line-clamp-2">
                        {poll.question}
                      </h3>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-white/70 text-sm mb-4">
                        <div className="flex items-center gap-1">
                          <HiOutlineChartBar />
                          <span>{poll.totalVotes} votes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{poll.options.length} options</span>
                        </div>
                      </div>

                      {/* Options Preview */}
                      <div className="space-y-2">
                        {poll.options.slice(0, 2).map((option, idx) => (
                          <div key={idx} className="flex items-center justify-between text-white/80 text-sm">
                            <span className="truncate max-w-[150px]">{option.text}</span>
                            <span className="font-medium">{option.votes}</span>
                          </div>
                        ))}
                        {poll.options.length > 2 && (
                          <div className="text-white/50 text-sm">
                            +{poll.options.length - 2} more options
                          </div>
                        )}
                      </div>

                      {/* Poll ID */}
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/40 text-xs font-mono">
                          ID: {poll.pollId}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Share Modal */}
      {selectedPoll && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          pollId={selectedPoll.pollId}
          question={selectedPoll.question}
          shareUrl={`${window.location.origin}/poll/${selectedPoll.pollId}`}
        />
      )}
    </div>
  );
};

export default PollHistory;