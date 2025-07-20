import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

function UserAvatar({ user }) {
  const [imgError, setImgError] = React.useState(false);
  
  if (user && user.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt="avatar"
        className="w-8 h-8 rounded-full border object-cover bg-gray-200 dark:bg-gray-700"
        onError={() => setImgError(true)}
      />
    );
  }
  
  // Fallback SVG avatar
  return (
    <span className="w-8 h-8 rounded-full border bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </span>
  );
}

const TopNav = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  // Firebase Auth: Listen for user changes
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Google sign in
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      alert('Google sign-in failed.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Get current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/create-test':
        return 'Create Test';
      case '/appear-test':
        return 'Appear for Test';
      case '/profile':
        return 'Profile';
      default:
        return 'Stare-Ware';
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SW</span>
              </div>
              <span className="text-xl font-bold text-blue-800 dark:text-blue-200">
                Stare-Ware
              </span>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => navigate('/')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-200'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/create-test')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/create-test'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-200'
                }`}
              >
                Create Test
              </button>
              <button
                onClick={() => navigate('/appear-test')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === '/appear-test'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-200'
                }`}
              >
                Appear for Test
              </button>
              {user && (
                <button
                  onClick={() => navigate('/profile')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === '/profile'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-200'
                  }`}
                >
                  Profile
                </button>
              )}
            </div>
          </div>

          {/* Right side - User info and controls */}
          <div className="flex items-center space-x-4">
            {/* Page Title */}
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {getPageTitle()}
              </h1>
            </div>

            {/* Dark Mode Toggle */}
            <button
              className={`px-3 py-1 rounded-lg font-semibold shadow transition border ${
                darkMode 
                  ? 'bg-gray-800 text-blue-200 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
              }`}
              onClick={() => setDarkMode(d => !d)}
              title="Toggle dark mode"
            >
              {darkMode ? '🌙' : '☀️'}
            </button>

            {/* User Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {user.displayName || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </span>
                </div>
                <UserAvatar user={user} />
                <div className="flex space-x-2">
                  <button
                    className="bg-blue-200 dark:bg-blue-700 hover:bg-blue-300 dark:hover:bg-blue-600 text-blue-700 dark:text-blue-200 font-semibold px-3 py-1 rounded-lg shadow transition text-sm"
                    onClick={() => navigate('/profile')}
                    title="View profile"
                  >
                    Profile
                  </button>
                  <button
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold px-3 py-1 rounded-lg shadow transition text-sm"
                    onClick={handleSignOut}
                    title="Sign out"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="bg-white dark:bg-gray-800 border border-blue-400 dark:border-gray-700 text-blue-700 dark:text-blue-200 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <g>
                    <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.06 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/>
                    <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/>
                    <path fill="#FBBC05" d="M9.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C-1.13 17.13-1.13 30.87 1.69 37.91l7.98-6.2z"/>
                    <path fill="#EA4335" d="M24 46c6.48 0 11.92-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.6 2.14-8.72 2.14-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.94 14.82 48 24 48z"/>
                    <path fill="none" d="M0 0h48v48H0z"/>
                  </g>
                </svg>
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav; 