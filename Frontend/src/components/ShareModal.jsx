import { motion, AnimatePresence } from 'framer-motion';
import { 
  HiOutlineX, 
} from 'react-icons/hi';
import { 
  FaWhatsapp, 
  FaTwitter, 
  FaFacebook, 
  FaTelegram,
  FaLinkedin,
  FaReddit,
  FaEnvelope
} from 'react-icons/fa';


const ShareModal = ({ isOpen, onClose, pollId, question, shareUrl }) => {
  const encodedText = encodeURIComponent(`📊 Vote on this poll: "${question}"\n`);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      url: `https://wa.me/?text=${encodedText}${encodedUrl}`
    },
    {
      name: 'Twitter',
      icon: FaTwitter,
      color: 'bg-blue-400',
      hoverColor: 'hover:bg-blue-500',
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
    },
    {
      name: 'Facebook',
      icon: FaFacebook,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'Telegram',
      icon: FaTelegram,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedin,
      color: 'bg-blue-700',
      hoverColor: 'hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      name: 'Reddit',
      icon: FaReddit,
      color: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-700',
      url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`
    },
    {
      name: 'Email',
      icon: FaEnvelope,
      color: 'bg-gray-600',
      hoverColor: 'hover:bg-gray-700',
      url: `mailto:?subject=${encodedText}&body=${encodedText}${encodedUrl}`
    }
  ];

  // Prevent click propagation to backdrop
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

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
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={handleModalClick}
              className="w-full max-w-2xl bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-2xl p-6 m-4"
              style={{
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Share Poll</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <HiOutlineX className="text-white text-xl" />
                </button>
              </div>

              {/* Poll Info */}
              <div className="glass-morphism rounded-xl p-4 mb-6">
                <p className="text-white/80 text-sm mb-1">Poll Question:</p>
                <p className="text-white font-medium break-words">{question}</p>
                <p className="text-white/60 text-xs mt-2 font-mono">Poll ID: {pollId}</p>
              </div>

              {/* Share Options */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {shareOptions.map((option) => (
                  <motion.a
                    key={option.name}
                    href={option.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${option.color} ${option.hoverColor} p-4 rounded-xl flex flex-col items-center gap-2 text-white transition-all cursor-pointer`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <option.icon className="text-2xl" />
                    <span className="text-xs font-medium text-center">{option.name}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShareModal;