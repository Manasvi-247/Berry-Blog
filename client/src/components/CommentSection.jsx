import { useEffect, useState } from 'react';
import { commentAPI, getSocket } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, Trash2 } from 'lucide-react';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();

    // Socket.IO real-time comment updates
    const socket = getSocket();

    // Listen for new comments
    socket.on('NEW_COMMENT', (comment) => {
      setComments((prev) => [comment, ...prev]);
    });

    // Listen for deleted comments
    socket.on('DELETE_COMMENT', (commentId) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    });

    return () => {
      socket.off('NEW_COMMENT');
      socket.off('DELETE_COMMENT');
    };
  }, [postId]);

  const loadComments = async () => {
    try {
      const data = await commentAPI.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setLoading(true);

    try {
      await commentAPI.createComment(postId, newComment.trim());
      setNewComment('');
      // Comment will be added via Socket.IO NEW_COMMENT event
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!user) return;

    try {
      await commentAPI.deleteComment(postId, commentId);
      // Comment will be removed via Socket.IO DELETE_COMMENT event
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-purple-100">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6 text-purple-500" />
        <h2 className="text-2xl font-bold text-gray-800">
          Comments ({comments.length})
        </h2>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
              className="flex-1 px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-2xl hover:from-purple-500 hover:to-pink-500 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-4 bg-pink-50 border border-pink-200 rounded-2xl text-center text-gray-600">
          Please sign in to comment
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment._id}
              className="p-4 bg-gradient-to-r from-pink-50/50 to-purple-50/50 rounded-2xl border border-pink-100"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-purple-600">
                    @{comment.user?.username}
                  </span>
                  <span className="text-sm text-gray-500">{formatTime(comment.createdAt)}</span>
                </div>
                {user && user.id === comment.user._id && (
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="text-red-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}