import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, LogOut, LayoutDashboard, Home } from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 transition">
              <Heart className="w-5 h-5 text-white" fill="white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              BerryBlog
            </span>
          </Link>

          {/* Nav Items */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-pink-500 transition rounded-xl hover:bg-pink-50"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-purple-500 transition rounded-xl hover:bg-purple-50"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                  <span className="text-sm font-semibold text-purple-600">
                    @{user.username}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-600 transition rounded-xl hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-pink-500 hover:text-pink-600 font-semibold transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold rounded-xl hover:from-pink-500 hover:to-purple-500 transition shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}