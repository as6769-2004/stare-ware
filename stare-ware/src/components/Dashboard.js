// src/components/Dashboard.js
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import TestCard from "./TestCard";
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const TESTS_KEY = "mcq_tests";

function TestPreviewModal({ test, onClose }) {
  if (!test) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto border-2 border-blue-200 dark:border-gray-700">
        <button className="absolute top-3 right-4 text-3xl text-gray-400 hover:text-red-500" onClick={onClose}>&times;</button>
        <h2 className="text-3xl font-extrabold mb-2 text-blue-700 dark:text-blue-200">{test.testTitle || 'Untitled Test'}</h2>
        <div className="mb-4 text-gray-600 dark:text-gray-300 italic">{test.description}</div>
        {test.questions && test.questions.length > 0 ? (
          <div className="space-y-6">
            {test.questions.map((q, idx) => (
              <div key={q.id} className="border rounded-xl p-4 bg-blue-50 dark:bg-gray-800 shadow-sm">
                <div className="font-semibold mb-1 text-lg text-blue-900 dark:text-blue-200">Q{idx + 1}: {q.questionText}</div>
                {q.questionMedia && q.questionMedia.url && (
                  <div className="mb-2">
                    {q.questionMedia.type.startsWith('image') && <img src={q.questionMedia.url} alt="media" className="max-h-32 rounded-lg border" />}
                    {q.questionMedia.type.startsWith('audio') && <audio controls src={q.questionMedia.url} className="w-full" />}
                    {q.questionMedia.type.startsWith('video') && <video controls src={q.questionMedia.url} className="max-h-32 rounded-lg border w-full" />}
                  </div>
                )}
                <ul className="ml-4">
                  {q.options.map((opt, oidx) => (
                    <li key={opt.id} className={opt.isCorrect ? 'font-bold text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}>
                      {String.fromCharCode(65 + oidx)}. {opt.text}
                      {opt.media && opt.media.url && (
                        <span className="ml-2">
                          {opt.media.type.startsWith('image') && <img src={opt.media.url} alt="media" className="inline max-h-8 rounded" />}
                          {opt.media.type.startsWith('audio') && <audio controls src={opt.media.url} className="inline" />}
                          {opt.media.type.startsWith('video') && <video controls src={opt.media.url} className="inline max-h-8 rounded" />}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {q.explanation && (
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-gray-700 rounded p-2">
                    <span className="font-semibold">Explanation:</span> {q.explanation}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Marks: {q.marks} | Timer: {q.timer || 'None'} sec
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 dark:text-gray-400">No questions in this test.</div>
        )}
      </div>
    </div>
  );
}

function UserAvatar({ user }) {
  const [imgError, setImgError] = useState(false);
  if (user && user.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt="avatar"
        className="w-10 h-10 rounded-full border object-cover bg-gray-200 dark:bg-gray-700"
        onError={() => setImgError(true)}
      />
    );
  }
  // Fallback SVG avatar
  return (
    <span className="w-10 h-10 rounded-full border bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
      <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1112 21a9 9 0 01-6.879-3.196z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [previewTest, setPreviewTest] = useState(null);
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Firebase Auth: Listen for user changes
  useEffect(() => {
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

  // Load all tests from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(TESTS_KEY);
    if (saved) {
      try {
        setTests(JSON.parse(saved));
      } catch {
        setTests([]);
      }
    }
  }, []);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Edit a test
  const handleEdit = (id) => {
    navigate(`/create-test?id=${id}`);
  };

  // Publish a test
  const handlePublish = (id) => {
    const updated = tests.map((t) =>
      t.id === id ? { ...t, status: "published", publishedAt: new Date().toISOString() } : t
    );
    setTests(updated);
    localStorage.setItem(TESTS_KEY, JSON.stringify(updated));
  };

  // Preview a test
  const handlePreview = (id) => {
    const found = tests.find(t => t.id === id);
    if (found) setPreviewTest(found);
  };

  // Change status (live, closed, etc)
  const handleStatusChange = (id, newStatus) => {
    const updated = tests.map(t => {
      if (t.id !== id) return t;
      if (newStatus === 'live') return { ...t, status: 'live', liveAt: new Date().toISOString() };
      if (newStatus === 'closed') return { ...t, status: 'closed', closedAt: new Date().toISOString() };
      return t;
    });
    setTests(updated);
    localStorage.setItem(TESTS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 font-sans p-0 transition-colors">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-center text-blue-800 dark:text-blue-200 tracking-tight drop-shadow">Test Platform Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              className={`px-3 py-1 rounded-lg font-semibold shadow transition border ${darkMode ? 'bg-gray-800 text-blue-200 border-gray-700 hover:bg-gray-700' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
              onClick={() => setDarkMode(d => !d)}
              title="Toggle dark mode"
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
            {user ? (
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl shadow px-4 py-2 border border-blue-100 dark:border-gray-700">
                <UserAvatar user={user} />
                <div className="flex flex-col">
                  <span className="font-semibold text-blue-800 dark:text-blue-200">{user.displayName || 'No Name'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-300">{user.email}</span>
                </div>
                <button
                  className="ml-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-blue-700 dark:text-blue-200 font-semibold px-3 py-1 rounded-lg shadow transition"
                  onClick={handleSignOut}
                >
                  Sign Out / Change Account
                </button>
              </div>
            ) : (
              <button
                className="bg-white dark:bg-gray-800 border border-blue-400 dark:border-gray-700 text-blue-700 dark:text-blue-200 font-semibold px-4 py-2 rounded-lg shadow hover:bg-blue-50 dark:hover:bg-gray-700 transition flex items-center gap-2"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C36.68 2.36 30.77 0 24 0 14.82 0 6.71 5.06 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.04l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M9.67 28.65c-1.13-3.36-1.13-6.99 0-10.35l-7.98-6.2C-1.13 17.13-1.13 30.87 1.69 37.91l7.98-6.2z"/><path fill="#EA4335" d="M24 46c6.48 0 11.92-2.15 15.9-5.85l-7.18-5.59c-2.01 1.35-4.6 2.14-8.72 2.14-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.71 42.94 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          <button
            onClick={() => navigate("/create-test")}
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-6 rounded-2xl shadow-lg text-2xl transition-all duration-200"
          >
            ➕ Create a Test
          </button>
          <button
            onClick={() => navigate("/appear-test")}
            className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white font-semibold py-6 rounded-2xl shadow-lg text-2xl transition-all duration-200"
          >
            📝 Appear for a Test
          </button>
        </div>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-200">Your Tests</h2>
          {tests.length === 0 && <div className="text-gray-500 dark:text-gray-400">No tests created yet.</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onEdit={() => handleEdit(test.id)}
                onPublish={() => handlePublish(test.id)}
                onPreview={() => handlePreview(test.id)}
                onStatusChange={status => handleStatusChange(test.id, status)}
              />
            ))}
          </div>
        </div>
      </div>
      {previewTest && <TestPreviewModal test={previewTest} onClose={() => setPreviewTest(null)} />}
    </div>
  );
}
