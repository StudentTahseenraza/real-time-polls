import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowRight } from 'react-icons/hi';

const API_URL = 'http://localhost:5000/api';

const CreatePoll = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    setIsCreating(true);
    try {
      console.log('Creating poll with:', { question: question.trim(), options: validOptions });
      
      const response = await axios.post(`${API_URL}/polls/create`, {
        question: question.trim(),
        options: validOptions
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Poll created response:', response.data);

      if (response.data.success) {
        toast.success('Poll created successfully!');
        navigate(`/poll/${response.data.data.pollId}`);
      } else {
        toast.error(response.data.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error(error.response?.data?.error || 'Failed to create poll');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <motion.div
          className="glass-morphism rounded-3xl p-8"
          whileHover={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          <h1 className="text-4xl font-bold text-white mb-8 text-center neon-glow">
            Create a New Poll
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white mb-2 font-medium">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                maxLength={500}
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">
                Options
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

            <motion.button
              type="submit"
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isCreating ? 'Creating...' : 'Create Poll'}
              <HiOutlineArrowRight className="animate-pulse" />
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CreatePoll;