import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postAPI } from '../lib/api';
import { Save, Eye, ArrowLeft, Trash2 } from 'lucide-react';

export default function Editor() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (id) {
      loadPost();
    } else {
      setInitialLoad(false);
    }
  }, [id, user, navigate]);

  const loadPost = async () => {
    if (!id || !user) return;

    try {
      const data = await postAPI.getPost(id);
      
      // Check if user is the author
      if (data.author._id !== user.id) {
        alert('You are not authorized to edit this post');
        navigate('/dashboard');
        return;
      }

      setTitle(data.title);
      setContent(data.content);
      setTags(data.tags?.join(', ') || '');
      setStatus(data.status);
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Failed to load post');
      navigate('/dashboard');
    } finally {
      setInitialLoad(false);
    }
  };

  const handleSave = async (newStatus) => {
    if (!user || !title.trim() || !content.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setLoading(true);

    try {
      const postData = {
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        status: newStatus
      };

      if (id) {
        await postAPI.updatePost(id, postData);
        alert('Post updated successfully!');
      } else {
        const newPost = await postAPI.createPost(postData);
        navigate(`/editor/${newPost._id}`);
        alert('Post created successfully!');
      }

      if (newStatus === 'published') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postAPI.deletePost(id);
      alert('Post deleted successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100 flex items-center justify-center">
        <div className="text-pink-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-pink-500 hover:text-pink-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          {id && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-xl border border-pink-100">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-8">
            {id ? 'Edit Post' : 'Create New Post'}
          </h1>

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your post title..."
                className="w-full px-4 py-3 bg-pink-50/50 border border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition text-lg font-semibold"
              />
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., lifestyle, travel, tech"
                className="w-full px-4 py-3 bg-purple-50/50 border border-purple-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                rows={16}
                className="w-full px-4 py-3 bg-pink-50/50 border border-pink-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition resize-none"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => handleSave('draft')}
                disabled={loading || !title.trim() || !content.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold rounded-2xl hover:from-purple-500 hover:to-pink-500 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Save as Draft
              </button>

              <button
                onClick={() => handleSave('published')}
                disabled={loading || !title.trim() || !content.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold rounded-2xl hover:from-pink-500 hover:to-purple-500 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="w-5 h-5" />
                Publish
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}