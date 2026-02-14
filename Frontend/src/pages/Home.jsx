import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  HiOutlineSparkles,
  HiOutlineShare,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineEye,
  HiOutlinePlusCircle
} from 'react-icons/hi';
import ShareModal from '../components/ShareModal';

const API_URL = 'https://real-time-polls.onrender.com/api';

const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [recentPolls, setRecentPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    fetchRecentPolls();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const fetchRecentPolls = async () => {
    try {
      const response = await axios.get(`${API_URL}/polls?limit=6`, {
        withCredentials: true
      });
      if (response.data.success) {
        setRecentPolls(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent polls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (poll, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedPoll(poll);
    setShowShareModal(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.h1 
            className="text-6xl md:text-7xl font-bold text-white mb-6 neon-glow"
            animate={{ 
              scale: [1, 1.02, 1],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            Real-Time Polls
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Create instant polls, share with anyone, and watch results update in real-time
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/create" 
              className="inline-block px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 hover:rotate-1"
            >
              Create New Poll
              <HiOutlineSparkles className="inline-block ml-2 animate-pulse" />
            </Link>
            
            <Link 
              to="/history" 
              className="inline-block px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-semibold text-lg hover:bg-white/30 transform hover:scale-105 transition-all duration-300"
            >
              View Poll History
              <HiOutlineEye className="inline-block ml-2" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 mt-24"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2
              }
            }
          }}
        >
          {[
            { icon: HiOutlineShare, title: "Shareable Links", desc: "Get unique links for each poll to share anywhere" },
            { icon: HiOutlineChartBar, title: "Real-Time Updates", desc: "Watch votes appear instantly across all devices" },
            { icon: HiOutlineShieldCheck, title: "Fair Voting", desc: "Built-in anti-abuse mechanisms for fair results" }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.6 }}
              whileHover={{ 
                scale: 1.05,
                rotateY: 10,
                transition: { duration: 0.3 }
              }}
              className="glass-morphism rounded-2xl p-8 text-white text-center perspective-1000"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <feature.icon className="text-5xl mx-auto mb-4 text-pink-300" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Polls */}
        {!loading && recentPolls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-24"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Recent Polls</h2>
              <Link 
                to="/history" 
                className="text-white/70 hover:text-white flex items-center gap-2 transition-all"
              >
                View All
                <HiOutlineEye />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPolls.map((poll, index) => (
                <motion.div
                  key={poll.pollId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="glass-morphism rounded-xl overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/poll/${poll.pollId}`)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <HiOutlineClock />
                        <span>{formatDate(poll.createdAt)}</span>
                      </div>
                      <button
                        onClick={(e) => handleShare(poll, e)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <HiOutlineShare className="text-white" />
                      </button>
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-3 line-clamp-2">
                      {poll.question}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-white/70 text-sm">
                      <span>{poll.totalVotes} votes</span>
                      <span>•</span>
                      <span>{poll.options.length} options</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-white/80 text-sm">
                        <span>Click to view results</span>
                        <HiOutlinePlusCircle className="group-hover:rotate-90 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
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

export default Home;