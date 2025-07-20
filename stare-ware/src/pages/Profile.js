import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const TESTS_KEY = 'mcq_tests';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    totalTests: 0,
    publishedTests: 0,
    draftTests: 0,
    liveTests: 0,
    closedTests: 0,
    totalQuestions: 0,
    averageQuestions: 0
  });

  // Firebase Auth: Listen for user changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  // Load tests and calculate stats
  useEffect(() => {
    const saved = localStorage.getItem(TESTS_KEY);
    if (saved) {
      try {
        const allTests = JSON.parse(saved);
        const userTests = user ? allTests.filter(t => t.ownerEmail === user.email) : [];
        setTests(userTests);
        
        // Calculate statistics
        const stats = {
          totalTests: userTests.length,
          publishedTests: userTests.filter(t => t.status === 'published').length,
          draftTests: userTests.filter(t => t.status === 'draft').length,
          liveTests: userTests.filter(t => t.status === 'live').length,
          closedTests: userTests.filter(t => t.status === 'closed').length,
          totalQuestions: userTests.reduce((sum, test) => sum + (test.questions?.length || 0), 0),
          averageQuestions: userTests.length > 0 ? 
            (userTests.reduce((sum, test) => sum + (test.questions?.length || 0), 0) / userTests.length).toFixed(1) : 0
        };
        setStats(stats);
      } catch {
        setTests([]);
      }
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view your profile.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and view your test statistics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Information Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-blue-200 dark:border-blue-700 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-blue-200 dark:border-blue-700 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                {user.displayName || 'User'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {user.email}
              </p>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Member since {user.metadata?.creationTime ? 
                  new Date(user.metadata.creationTime).toLocaleDateString() : 
                  'Recently'
                }
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/create-test')}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Create New Test
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Statistics and Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.totalTests}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Tests
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.publishedTests}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Published
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.draftTests}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Drafts
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalQuestions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Questions
              </div>
            </div>
          </div>

          {/* Recent Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Recent Tests
            </h3>
            {tests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 dark:text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No tests created yet
                </p>
                <button
                  onClick={() => navigate('/create-test')}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Create Your First Test
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tests.slice(0, 5).map((test) => (
                  <div
                    key={test.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer"
                    onClick={() => navigate(`/create-test?id=${test.id}`)}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        {test.testTitle || 'Untitled Test'}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {test.questions?.length || 0} questions • {test.status}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        test.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        test.status === 'draft' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        test.status === 'live' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {test.status}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
                {tests.length > 5 && (
                  <div className="text-center pt-4">
                    <button
                      onClick={() => navigate('/')}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all {tests.length} tests
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Account Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Account Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    Email Address
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
                  Verified
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    Account Type
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Google Account
                  </p>
                </div>
                <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  Connected
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    Data Storage
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Local Storage
                  </p>
                </div>
                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 