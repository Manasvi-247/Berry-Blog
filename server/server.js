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
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Socket.IO Real-Time Logic
const roomViewers = new Map(); // Track viewers per post room

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Join post room for live viewing
  socket.on('JOIN_POST_ROOM', (postId) => {
    socket.join(`post-${postId}`);
    
    // Increment viewer count
    const currentCount = roomViewers.get(postId) || 0;
    roomViewers.set(postId, currentCount + 1);
    
    // Broadcast updated count to all in room
    io.to(`post-${postId}`).emit('LIVE_COUNT_UPDATE', {
      postId,
      viewerCount: roomViewers.get(postId)
    });
    
    console.log(`👀 User joined post-${postId}. Current viewers: ${roomViewers.get(postId)}`);
  });

  // Leave post room
  socket.on('LEAVE_POST_ROOM', (postId) => {
    socket.leave(`post-${postId}`);
    
    // Decrement viewer count
    const currentCount = roomViewers.get(postId) || 0;
    const newCount = Math.max(0, currentCount - 1);
    roomViewers.set(postId, newCount);
    
    // Broadcast updated count
    io.to(`post-${postId}`).emit('LIVE_COUNT_UPDATE', {
      postId,
      viewerCount: newCount
    });
    
    console.log(`👋 User left post-${postId}. Current viewers: ${newCount}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    
    // Clean up viewer counts when socket disconnects
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('post-')) {
        const postId = room.replace('post-', '');
        const currentCount = roomViewers.get(postId) || 0;
        const newCount = Math.max(0, currentCount - 1);
        roomViewers.set(postId, newCount);
        
        io.to(room).emit('LIVE_COUNT_UPDATE', {
          postId,
          viewerCount: newCount
        });
      }
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Flux Blog API is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };

// models/User.js
/*
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['author', 'admin'],
    default: 'author'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
*/