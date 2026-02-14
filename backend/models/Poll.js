import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  pollId: {
    type: String,
    required: true,
    unique: true
  },
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  options: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 
  },
  ipAddresses: [{
    ip: String,
    votedAt: Date,
    choice: Number
  }],
  cookies: [{
    cookieId: String,
    votedAt: Date,
    choice: Number
  }],
  userAgents: [{
    ua: String,
    votedAt: Date,
    choice: Number
  }],
  totalVotes: {
    type: Number,
    default: 0
  }
});

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;