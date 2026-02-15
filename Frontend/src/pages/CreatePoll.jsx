import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineChartBar
} from 'react-icons/hi';

const API_URL = 'http://localhost:5000/api';


// const API_URL = 'https://real-time-polls.onrender.com/api';

const CreatePoll = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [creatorInfo, setCreatorInfo] = useState({
    name: '',
    email: ''
  });
  const [saveCreator, setSaveCreator] = useState(true);
  const [showTips, setShowTips] = useState(true);

  // Load creator info from localStorage on mount
  useEffect(() => {
    const savedCreator = localStorage.getItem('creatorInfo');
    if (savedCreator) {
      setCreatorInfo(JSON.parse(savedCreator));
    }
  }, []);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    } else {
      toast.error('Maximum 10 options allowed');
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatorInfoChange = (field, value) => {
    setCreatorInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return false;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('Please add at least 2 options');
      return false;
    }

    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.toLowerCase().trim());
    const hasDuplicates = new Set(optionTexts).size !== optionTexts.length;
    if (hasDuplicates) {
      toast.error('Options must be unique');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const validOptions = options.filter(opt => opt.trim());
      
      console.log('Creating poll with:', { 
        question: question.trim(), 
        options: validOptions,
        creator: saveCreator ? creatorInfo : null
      });
      
      const response = await axios.post(`${API_URL}/polls/create`, {
        question: question.trim(),
        options: validOptions,
        creator: saveCreator ? creatorInfo : null
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Poll created response:', response.data);

      if (response.data.success) {
        // ========== MODIFIED SECTION ==========
        // 1. Store in creator polls list (for history/management)
        const creatorPolls = JSON.parse(localStorage.getItem('creatorPolls') || '[]');
        const newPoll = {
          pollId: response.data.data.pollId,
          question: question.trim(),
          createdAt: new Date().toISOString(),
          options: validOptions,
          totalVotes: 0
        };
        
        // Add to beginning of array (most recent first)
        creatorPolls.unshift(newPoll);
        
        // Keep only last 50 polls
        const limitedPolls = creatorPolls.slice(0, 50);
        localStorage.setItem('creatorPolls', JSON.stringify(limitedPolls));
        
        // 2. Store creator info if user wants to save it
        if (saveCreator && creatorInfo.name) {
          localStorage.setItem('creatorInfo', JSON.stringify(creatorInfo));
        }
        
        // 3. Set session flag for this poll (to identify as creator)
        sessionStorage.setItem(`creator_${response.data.data.pollId}`, 'true');
        
        // 4. Dispatch custom event for real-time updates on home page
        window.dispatchEvent(new CustomEvent('pollCreated', { 
          detail: { 
            pollId: response.data.data.pollId,
            question: question.trim(),
            timestamp: new Date().toISOString()
          }
        }));
        
        // 5. Show success message with animation
        toast.success(
          <div className="flex items-center gap-2">
            <HiOutlineSparkles className="text-yellow-400 animate-spin" />
            <span>Poll created successfully!</span>
          </div>,
          { duration: 3000 }
        );
        
        // 6. Navigate to the new poll with creator state
        navigate(`/poll/${response.data.data.pollId}`, {
          state: { 
            isCreator: true,
            fromCreation: true,
            pollData: {
              question: question.trim(),
              options: validOptions
            }
          }
        });
        // ========== END MODIFIED SECTION ==========
        
      } else {
        toast.error(response.data.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      
      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection.');
      } else if (error.response) {
        // Server responded with error
        toast.error(error.response.data?.error || 'Server error occurred');
      } else if (error.request) {
        // Request made but no response
        toast.error('Cannot connect to server. Please try again.');
      } else {
        // Something else happened
        toast.error('Failed to create poll. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickFill = () => {
    setQuestion('What is your favorite programming language?');
    setOptions(['JavaScript', 'Python', 'Java', 'C++', 'TypeScript']);
    toast.success('Sample poll loaded!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="mb-6 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all group"
          whileHover={{ x: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <HiOutlineArrowLeft className="group-hover:animate-pulse" />
          <span>Back to Home</span>
        </motion.button>

        <motion.div
          className="glass-morphism rounded-3xl p-8"
          whileHover={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          <h1 className="text-4xl font-bold text-white mb-8 text-center neon-glow flex items-center justify-center gap-2">
            <HiOutlineSparkles className="text-yellow-300" />
            Create a New Poll
            <HiOutlineSparkles className="text-yellow-300" />
          </h1>

          {/* Quick Fill Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleQuickFill}
              className="text-sm text-white/60 hover:text-white flex items-center gap-1 transition-all"
            >
              <HiOutlineChartBar />
              Load Sample Poll
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Input */}
            <div>
              <label className="block text-white mb-2 font-medium flex items-center gap-2">
                Question
                <span className="text-xs text-white/40">(max 500 characters)</span>
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                maxLength={500}
              />
              <div className="mt-1 text-right text-xs text-white/40">
                {question.length}/500
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-white mb-2 font-medium flex items-center gap-2">
                Options
                <span className="text-xs text-white/40">(min: 2, max: 10)</span>
              </label>
              <AnimatePresence>
                {options.map((option, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                      maxLength={200}
                    />
                    {options.length > 2 && (
                      <motion.button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-white transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Remove option"
                      >
                        <HiOutlineTrash />
                      </motion.button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {options.length < 10 && (
                <motion.button
                  type="button"
                  onClick={addOption}
                  className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white flex items-center gap-2 transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <HiOutlinePlus />
                  Add Option
                </motion.button>
              )}
            </div>

            {/* Creator Info (Optional) */}
            <div className="glass-morphism rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-white font-medium flex items-center gap-2">
                  <HiOutlineShieldCheck className="text-green-400" />
                  Creator Information (Optional)
                </label>
                <label className="flex items-center gap-2 text-white/60 text-sm">
                  <input
                    type="checkbox"
                    checked={saveCreator}
                    onChange={(e) => setSaveCreator(e.target.checked)}
                    className="rounded bg-white/10 border-white/20"
                  />
                  Save for next time
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={creatorInfo.name}
                  onChange={(e) => handleCreatorInfoChange('name', e.target.value)}
                  placeholder="Your name (optional)"
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <input
                  type="email"
                  value={creatorInfo.email}
                  onChange={(e) => handleCreatorInfoChange('email', e.target.value)}
                  placeholder="Email (optional)"
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isCreating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating Poll...</span>
                </>
              ) : (
                <>
                  <span>Create Poll</span>
                  <HiOutlineArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
              
              {/* Animated background effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </motion.button>
          </form>

          {/* Tips Section */}
          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 overflow-hidden"
              >
                <div className="glass-morphism rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <HiOutlineSparkles className="text-yellow-300" />
                      Pro Tips
                    </h3>
                    <button
                      onClick={() => setShowTips(false)}
                      className="text-white/40 hover:text-white text-sm"
                    >
                      Hide
                    </button>
                  </div>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      Keep your question clear and concise for better engagement
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      Add 3-5 options for optimal voting experience
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      You'll be identified as the creator and can see voter details
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      Share the link - others can vote but won't see back button
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Preview */}
          <div className="mt-6 flex items-center justify-center gap-4 text-white/40 text-xs">
            <div className="flex items-center gap-1">
              <HiOutlineClock />
              <span>Polls expire in 30 days</span>
            </div>
            <div>•</div>
            <div className="flex items-center gap-1">
              <HiOutlineShieldCheck />
              <span>Anti-abuse protection active</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CreatePoll;

