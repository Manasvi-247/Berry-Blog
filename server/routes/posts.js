const express = require('express');
const { Post, Comment, PostView, User } = require('../models');
const { authRequired } = require('./auth');

const router = express.Router();

// ============================================
// POST ROUTES
// ============================================

// @route   GET /api/posts
// @desc    Get all published posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find({ status: 'published' })
      .populate('author', 'username')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// @route   GET /api/posts/user/my-posts
// @desc    Get current user's posts (drafts + published)
// @access  Private
router.get('/user/my-posts', authRequired, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.userId })
      .sort({ updatedAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post('/', authRequired, async (req, res) => {
  try {
    const { title, content, tags, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const post = new Post({
      title,
      content,
      author: req.user.userId,
      tags: tags || [],
      status: status || 'draft'
    });

    await post.save();
    await post.populate('author', 'username');

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (author only)
router.put('/:id', authRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }

    const { title, content, tags, status } = req.body;

    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags !== undefined ? tags : post.tags;
    post.status = status || post.status;

    await post.save();
    await post.populate('author', 'username');

    res.json(post);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (author only)
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    // Delete associated comments
    await Comment.deleteMany({ post: req.params.id });

    // Delete post views
    await PostView.deleteOne({ post: req.params.id });

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ============================================
// COMMENT ROUTES
// ============================================

// @route   GET /api/posts/:postId/comments
// @desc    Get all comments for a post
// @access  Public
router.get('/:postId/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// @route   POST /api/posts/:postId/comments
// @desc    Add comment to post (with real-time Socket.IO broadcast)
// @access  Private
router.post('/:postId/comments', authRequired, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comment = new Comment({
      post: req.params.postId,
      user: req.user.userId,
      content: content.trim()
    });

    await comment.save();
    await comment.populate('user', 'username');

    // 🔥 REAL-TIME: Broadcast new comment via Socket.IO
    const io = req.app.get('io');
    io.to(`post-${req.params.postId}`).emit('NEW_COMMENT', comment);

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// @route   DELETE /api/posts/:postId/comments/:commentId
// @desc    Delete comment
// @access  Private (comment author only)
router.delete('/:postId/comments/:commentId', authRequired, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    // 🔥 REAL-TIME: Broadcast comment deletion via Socket.IO
    const io = req.app.get('io');
    io.to(`post-${req.params.postId}`).emit('DELETE_COMMENT', req.params.commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// ============================================
// DASHBOARD STATS ROUTES
// ============================================

// @route   GET /api/posts/user/stats
// @desc    Get user's dashboard statistics
// @access  Private
router.get('/user/stats', authRequired, async (req, res) => {
  try {
    const [published, drafts, userPosts] = await Promise.all([
      Post.countDocuments({ author: req.user.userId, status: 'published' }),
      Post.countDocuments({ author: req.user.userId, status: 'draft' }),
      Post.find({ author: req.user.userId }).select('_id')
    ]);

    // Calculate total views
    const postIds = userPosts.map(p => p._id);
    const views = await PostView.find({ post: { $in: postIds } });
    const totalViews = views.reduce((sum, v) => sum + v.viewerCount, 0);

    res.json({
      publishedCount: published,
      draftCount: drafts,
      totalViews
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;