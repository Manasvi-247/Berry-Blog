import axios from "axios";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

// Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Debug logging
console.log("API_URL:", API_URL);
console.log("SOCKET_URL:", SOCKET_URL);

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Socket.IO instance
let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected");
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

// ============================================
// AUTH API
// ============================================

export const authAPI = {
  register: async (username, email, password) => {
    console.log("Making registration request to:", API_URL + "/auth/register");
    const { data } = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  },

  login: async (email, password) => {
    console.log("Making login request to:", API_URL + "/auth/login");
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("token");
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getCurrentUser: async () => {
    const { data } = await api.get("/auth/me");
    return data;
  },
};

// ============================================
// POST API
// ============================================

export const postAPI = {
  // Get all published posts
  getAllPosts: async () => {
    const { data } = await api.get("/posts");
    return data;
  },

  // Get single post
  getPost: async (id) => {
    const { data } = await api.get(`/posts/${id}`);
    return data;
  },

  // Get user's posts
  getMyPosts: async () => {
    const { data } = await api.get("/posts/user/my-posts");
    return data;
  },

  // Get dashboard stats
  getStats: async () => {
    const { data } = await api.get("/posts/user/stats");
    return data;
  },

  // Create post
  createPost: async (postData) => {
    const { data } = await api.post("/posts", postData);
    return data;
  },

  // Update post
  updatePost: async (id, postData) => {
    const { data } = await api.put(`/posts/${id}`, postData);
    return data;
  },

  // Delete post
  deletePost: async (id) => {
    const { data } = await api.delete(`/posts/${id}`);
    return data;
  },
};

// ============================================
// COMMENT API
// ============================================

export const commentAPI = {
  // Get comments for post
  getComments: async (postId) => {
    const { data } = await api.get(`/posts/${postId}/comments`);
    return data;
  },

  // Create comment
  createComment: async (postId, content) => {
    const { data } = await api.post(`/posts/${postId}/comments`, { content });
    return data;
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    const { data } = await api.delete(`/posts/${postId}/comments/${commentId}`);
    return data;
  },
};

export default api;
