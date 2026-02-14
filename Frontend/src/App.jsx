import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import CreatePoll from './pages/CreatePoll';
import PollRoom from './pages/PollRoom';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePoll />} />
          <Route path="/poll/:pollId" element={<PollRoom />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;