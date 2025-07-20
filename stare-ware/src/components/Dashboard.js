// src/components/Dashboard.js
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import TestCard from "./TestCard";
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { loadUserTests, saveTest, deleteTest } from '../utils/firestore';

const TESTS_KEY = "mcq_tests";

// Validation function (same as in CreateTest.js)
function validateTest(test) {
  // Check test title
  if (!test.testTitle || !test.testTitle.trim()) {
    return 'Test title is required.';
  }
  
  // Check if there are any questions
  if (!test.questions || test.questions.length === 0) {
    return 'At least one question is required.';
  }
  
  // Validate each question
  for (const [i, q] of test.questions.entries()) {
    const questionNumber = i + 1;
    
    // Check question text
    if (!q.questionText || !q.questionText.trim()) {
      return `Question ${questionNumber}: Question text is required.`;
    }
    
    // Check options array exists and has correct length
    if (!q.options || q.options.length < 2 || q.options.length > 6) {
      return `Question ${questionNumber}: Must have 2-6 options.`;
    }
    
    // Check all options have text
    for (const [optIdx, opt] of q.options.entries()) {
      if (!opt.text || !opt.text.trim()) {
        return `Question ${questionNumber}, Option ${optIdx + 1}: Option text is required.`;
      }
    }
    
    // Check at least one option is marked as correct
    if (!q.options.some(opt => opt.isCorrect)) {
      return `Question ${questionNumber}: Mark at least one correct answer.`;
    }
    
    // Check marks
    if (!q.marks || q.marks < 1) {
      return `Question ${questionNumber}: Marks must be at least 1.`;
    }
    
    // Check timer if provided
    if (q.timer !== undefined && q.timer !== '' && (isNaN(q.timer) || q.timer < 0)) {
      return `Question ${questionNumber}: Timer must be a positive number.`;
    }
  }
  
  return '';
}

function TestPreviewModal({ test, onClose }) {
  if (!test) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto border-2 border-blue-200 dark:border-gray-700">
        <button className="absolute top-3 right-4 text-3xl text-gray-400 hover:text-red-500" onClick={onClose}>&times;</button>
        <h2 className="text-3xl font-extrabold mb-2 text-blue-700 dark:text-blue-200">{test.testTitle || 'Untitled Test'}</h2>
        <div className="mb-4 text-gray-600 dark:text-gray-300 italic">{test.description}</div>
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          Created: {test.createdAt ? new Date(test.createdAt).toLocaleString() : 'N/A'} | Updated: {test.updatedAt ? new Date(test.updatedAt).toLocaleString() : 'N/A'}
        </div>
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



export default function Dashboard() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [previewTest, setPreviewTest] = useState(null);
  const [user, setUser] = useState(null);

  // Firebase Auth: Listen for user changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);



  // Load all tests from Firestore
  useEffect(() => {
    if (!user) {
      setTests([]);
      return;
    }
    loadUserTests(user).then(setTests).catch(() => setTests([]));
  }, [user]);



  // Edit a test
  const handleEdit = (id) => {
    navigate(`/create-test?id=${id}`);
  };

  // Publish a test with validation
  const handlePublish = async (id) => {
    const test = tests.find(t => t.id === id);
    if (!test) return;
    const validationError = validateTest(test);
    if (validationError) {
      alert(`Cannot publish test: ${validationError}\n\nPlease fix the validation errors before publishing.`);
      return;
    }
    const updatedTest = { ...test, status: 'published', publishedAt: new Date().toISOString() };
    await saveTest(updatedTest, user);
    setTests(tests.map(t => t.id === id ? updatedTest : t));
    alert('Test published successfully!');
  };

  // Preview a test
  const handlePreview = (id) => {
    const found = tests.find(t => t.id === id);
    if (found) setPreviewTest(found);
  };

  // Change status (live, closed, etc)
  const handleStatusChange = async (id, newStatus) => {
    const test = tests.find(t => t.id === id);
    if (!test) return;
    let updatedTest = { ...test };
    if (newStatus === 'live') updatedTest = { ...updatedTest, status: 'live', liveAt: new Date().toISOString() };
    if (newStatus === 'closed') updatedTest = { ...updatedTest, status: 'closed', closedAt: new Date().toISOString() };
    await saveTest(updatedTest, user);
    setTests(tests.map(t => t.id === id ? updatedTest : t));
  };

  // Delete a test
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    await deleteTest(id);
    setTests(tests.filter(t => t.id !== id));
  };

  // Filter tests by current user
  const filteredTests = user
    ? tests.filter(t => t.ownerEmail === user.email)
    : [];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-4xl font-extrabold text-center text-blue-800 dark:text-blue-200 tracking-tight drop-shadow">Test Platform Dashboard</h1>
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
        {!user && <div className="text-gray-500 dark:text-gray-400">Sign in to view your tests.</div>}
        {user && filteredTests.length === 0 && <div className="text-gray-500 dark:text-gray-400">No tests created yet for this account.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onEdit={() => handleEdit(test.id)}
              onPublish={() => handlePublish(test.id)}
              onPreview={() => handlePreview(test.id)}
              onStatusChange={status => handleStatusChange(test.id, status)}
              onDelete={() => handleDelete(test.id)}
            />
          ))}
        </div>
      </div>
      
      {previewTest && <TestPreviewModal test={previewTest} onClose={() => setPreviewTest(null)} />}
    </div>
  );
}
