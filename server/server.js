const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',         // dev frontend
  'https://berry-blog.vercel.app'  // deployed frontend
];

// Middleware
app.use(cors({
  origin: function(origin, callback){
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('CORS not allowed'))
    }
  },
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Make io accessible in routes
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Socket.IO Real-Time Logic
const roomViewers = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('JOIN_POST_ROOM', (postId) => {
    socket.join(`post-${postId}`);
    const currentCount = roomViewers.get(postId) || 0;
    roomViewers.set(postId, currentCount + 1);
    io.to(`post-${postId}`).emit('LIVE_COUNT_UPDATE', { postId, viewerCount: roomViewers.get(postId) });
  });

  socket.on('LEAVE_POST_ROOM', (postId) => {
    socket.leave(`post-${postId}`);
    const currentCount = roomViewers.get(postId) || 0;
    roomViewers.set(postId, Math.max(0, currentCount - 1));
    io.to(`post-${postId}`).emit('LIVE_COUNT_UPDATE', { postId, viewerCount: roomViewers.get(postId) });
  });

  socket.on('disconnect', () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('post-')) {
        const postId = room.replace('post-', '');
        const currentCount = roomViewers.get(postId) || 0;
        roomViewers.set(postId, Math.max(0, currentCount - 1));
        io.to(room).emit('LIVE_COUNT_UPDATE', { postId, viewerCount: roomViewers.get(postId) });
      }
    });
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flux Blog API is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = { app, io };