import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { postAPI } from '../lib/api';
import { BookOpen, Clock, Tag } from 'lucide-react';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postAPI.getAllPosts();
      setPosts(data);
    } catch (error) {
      console.error('Error loading posts:', error);
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

  const getExcerpt = (content) => {
    return content.length > 200 ? content.substring(0, 200) + '...' : content;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-pink-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cream-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
            BerryBlog
          </h1>
          <p className="text-xl text-gray-600">Real-Time Content Stream</p>
        </div>

        {/* No Posts */}
        {posts.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center text-gray-500 border border-pink-100 shadow-lg">
            <p className="text-lg">No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post._id}
                className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-pink-100 transition-all hover:shadow-xl hover:scale-[1.02] hover:bg-purple-50"
              >
                <Link to={`/post/${post._id}`}>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3 hover:text-pink-500 transition">
                    {post.title}
                  </h2>
                </Link>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-purple-500">
                      @{post.author?.username}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(post.createdAt)}
                  </span>
                </div>

                <p className="text-gray-700 leading-relaxed mb-4">
                  {getExcerpt(post.content)}
                </p>

                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-pink-400" />
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  to={`/post/${post._id}`}
                  className="inline-flex items-center gap-2 text-pink-500 hover:text-pink-600 font-semibold transition"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}