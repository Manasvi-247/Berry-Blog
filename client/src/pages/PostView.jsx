import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postAPI, getSocket } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Clock, User, Eye, ArrowLeft, Tag } from 'lucide-react';
import CommentSection from '../components/CommentSection';

export default function PostView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    loadPost();
    
    // Initialize Socket.IO for real-time features
    const socket = getSocket();
    
    // Join the post room for live updates
    socket.emit('JOIN_POST_ROOM', id);

    // Listen for live viewer count updates
    socket.on('LIVE_COUNT_UPDATE', (data) => {
      if (data.postId === id) {
        setViewerCount(data.viewerCount);
      }
    });

    // Cleanup: Leave room when component unmounts
    return () => {
      socket.emit('LEAVE_POST_ROOM', id);
      socket.off('LIVE_COUNT_UPDATE');
    };
  }, [id]);

  const loadPost = async () => {
    if (!id) return;

    try {
      const data = await postAPI.getPost(id);
      setPost(data);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100 flex items-center justify-center">
        <div className="text-pink-500">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Post not found</h2>
          <Link to="/" className="text-pink-500 hover:text-pink-600">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 mb-8 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all posts
        </Link>

        <article className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl border border-pink-100 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-purple-500">
                  @{post.author?.username}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(post.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full">
              <Eye className="w-4 h-4 text-pink-500" />
              <span className="font-semibold text-pink-600">{viewerCount} viewing</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">{post.title}</h1>

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-8">
              <Tag className="w-4 h-4 text-pink-400" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
        </article>

        <CommentSection postId={post._id} />
      </div>
    </div>
  );
}