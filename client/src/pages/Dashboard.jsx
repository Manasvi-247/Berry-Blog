import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { postAPI } from '../lib/api';
import { FileText, Edit, Eye, PlusCircle, TrendingUp, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);
  const [stats, setStats] = useState({ publishedCount: 0, draftCount: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      const [postsData, statsData] = await Promise.all([
        postAPI.getMyPosts(),
        postAPI.getStats()
      ]);

      setDrafts(postsData.filter((p) => p.status === 'draft'));
      setPublished(postsData.filter((p) => p.status === 'published'));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-600">Here's your content overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-pink-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-pink-500">{stats.publishedCount}</span>
            </div>
            <h3 className="text-gray-700 font-semibold">Published Posts</h3>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl flex items-center justify-center">
                <Edit className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-purple-500">{stats.draftCount}</span>
            </div>
            <h3 className="text-gray-700 font-semibold">Drafts</h3>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-pink-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-400 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                {stats.totalViews}
              </span>
            </div>
            <h3 className="text-gray-700 font-semibold">Total Live Views</h3>
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Your Content</h2>
          <Link
            to="/editor"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold rounded-2xl hover:from-pink-500 hover:to-purple-500 transition shadow-lg hover:shadow-xl"
          >
            <PlusCircle className="w-5 h-5" />
            New Post
          </Link>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit className="w-5 h-5 text-purple-500" />
              Drafts
            </h3>
            {drafts.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center text-gray-500 border border-purple-100">
                No drafts yet. Start writing your first post!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {drafts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition"
                  >
                    <h4 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Updated {formatDate(post.updatedAt)}
                      </span>
                      <Link
                        to={`/editor/${post._id}`}
                        className="text-purple-500 hover:text-purple-600 font-semibold flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-pink-500" />
              Published
            </h3>
            {published.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center text-gray-500 border border-pink-100">
                No published posts yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {published.map((post) => (
                  <div
                    key={post._id}
                    className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-pink-100 hover:shadow-xl transition"
                  >
                    <h4 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.content.substring(0, 100)}...
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">
                        Published {formatDate(post.createdAt)}
                      </span>
                      <div className="flex gap-3">
                        <Link
                          to={`/post/${post._id}`}
                          className="text-pink-500 hover:text-pink-600 font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          to={`/editor/${post._id}`}
                          className="text-purple-500 hover:text-purple-600 font-semibold flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}