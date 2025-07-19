import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MCQQuestionList from './MCQQuestionList';
import TagSelector from './TagSelector';
import {
  signInWithGoogleDrive,
  uploadFileToDrive,
  listDriveFiles,
  downloadFileFromDrive,
} from '../../utils/googleDrive';

const TESTS_KEY = 'mcq_tests';

const MCQTestForm = ({ test, setTest, onSave, onPublish, publishError, canPublish }) => {
  const { testTitle, description, tags, questions, status, id } = test;
  const [preview, setPreview] = useState(false);
  const navigate = useNavigate();
  const [driveUser, setDriveUser] = useState(null);
  const [driveStatus, setDriveStatus] = useState('');
  const [driveError, setDriveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Google Drive sign in (auto on mount)
  useEffect(() => {
    (async () => {
      try {
        const user = await signInWithGoogleDrive();
        setDriveUser(user);
      } catch (e) {
        setDriveUser(null);
      }
    })();
  }, []);

  // Auto-save to Google Drive on every test change (if signed in)
  useEffect(() => {
    if (!driveUser || !testTitle) return;
    setIsSaving(true);
    setDriveStatus('Saving to Google Drive...');
    uploadFileToDrive({
      name: `${testTitle || 'Untitled'} (stare-ware).json`,
      content: JSON.stringify(test, null, 2),
      mimeType: 'application/json',
    })
      .then(() => {
        setDriveStatus('Auto-saved to Google Drive!');
        setDriveError('');
      })
      .catch((e) => {
        setDriveError('Drive save failed: ' + e.message);
        setDriveStatus('');
      })
      .finally(() => setIsSaving(false));
    // eslint-disable-next-line
  }, [test, driveUser]);

  // Load from Google Drive
  const handleLoadFromDrive = async () => {
    setDriveStatus('Loading from Google Drive...');
    setDriveError('');
    try {
      const files = await listDriveFiles();
      if (!files.length) {
        setDriveError('No test files found in your Google Drive.');
        setDriveStatus('');
        return;
      }
      const file = files[0]; // For demo, just pick the first file
      const content = await downloadFileFromDrive(file.id);
      setTest(JSON.parse(content));
      setDriveStatus(`Loaded "${file.name}" from Google Drive!`);
    } catch (e) {
      setDriveError('Drive load failed: ' + e.message);
      setDriveStatus('');
    }
  };

  // Local autosave to localStorage (for fallback)
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(TESTS_KEY);
    let tests = [];
    if (saved) {
      try {
        tests = JSON.parse(saved);
      } catch {}
    }
    const idx = tests.findIndex(t => t.id === id);
    if (idx >= 0) {
      tests[idx] = test;
    } else {
      tests.push(test);
    }
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
  }, [test, id]);

  // Update test fields
  const handleField = (field, value) => {
    setTest({ ...test, [field]: value });
  };

  // Update questions
  const handleQuestions = (qs) => {
    setTest({ ...test, questions: qs });
  };

  // Output JSON for backend
  const getTestJSON = () => ({ ...test, createdAt: test.createdAt || new Date().toISOString() });

  return (
    <div className="max-w-3xl mx-auto p-4 font-sans">
      <button
        className="mb-6 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-blue-700 font-semibold shadow transition"
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 mb-8">
        <h1 className="text-3xl font-extrabold mb-6 text-blue-800 tracking-tight drop-shadow">{test.id ? 'Edit MCQ Test' : 'Create MCQ Test'}</h1>
        <div className="mb-4 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <span className="font-semibold text-blue-700">Google Drive:</span>
            {driveUser ? (
              <span className="text-green-700 font-semibold">Signed in as {driveUser.getName()}</span>
            ) : (
              <span className="text-red-600">Not signed in</span>
            )}
            <button
              className="ml-2 bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm"
              onClick={handleLoadFromDrive}
              disabled={!driveUser}
            >
              Load from Drive
            </button>
            {isSaving && <span className="ml-2 text-xs text-blue-500 animate-pulse">Saving...</span>}
          </div>
          {driveStatus && <div className="text-green-700 text-xs">{driveStatus}</div>}
          {driveError && <div className="text-red-600 text-xs">{driveError}</div>}
        </div>
        <div className="mb-4">
          <input
            type="text"
            className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 mb-3 text-lg focus:outline-none focus:border-blue-400 transition"
            placeholder="Test Title"
            value={testTitle}
            onChange={e => handleField('testTitle', e.target.value)}
          />
          <textarea
            className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:border-blue-400 transition"
            placeholder="Test Description"
            value={description}
            onChange={e => handleField('description', e.target.value)}
            rows={3}
          />
          <div className="mt-4">
            <TagSelector tags={tags} onChange={tags => handleField('tags', tags)} />
          </div>
        </div>
        <div className="flex gap-4 mb-6">
          <button
            className={`px-5 py-2 rounded-lg font-semibold shadow transition ${!preview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-700'}`}
            onClick={() => setPreview(false)}
          >
            Edit
          </button>
          <button
            className={`px-5 py-2 rounded-lg font-semibold shadow transition ${preview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-blue-700'}`}
            onClick={() => setPreview(true)}
          >
            Preview
          </button>
        </div>
        {!preview ? (
          <MCQQuestionList questions={questions} setQuestions={handleQuestions} />
        ) : (
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-inner p-6">
            <h2 className="text-xl font-bold mb-4 text-blue-700">Preview</h2>
            {questions.length === 0 && <p className="text-gray-500">No questions yet.</p>}
            {questions.map((q, idx) => (
              <div key={q.id} className="mb-8 border rounded-xl p-4 bg-blue-50 shadow-sm">
                <div className="font-bold mb-2 text-blue-900 text-lg">Q{idx + 1}: {q.questionText}</div>
                {q.questionMedia && q.questionMedia.url && (
                  <div className="mb-2">
                    {q.questionMedia.type.startsWith('image') && <img src={q.questionMedia.url} alt="media" className="max-h-32 rounded-lg border" />}
                    {q.questionMedia.type.startsWith('audio') && <audio controls src={q.questionMedia.url} className="w-full" />}
                    {q.questionMedia.type.startsWith('video') && <video controls src={q.questionMedia.url} className="max-h-32 rounded-lg border w-full" />}
                  </div>
                )}
                <ul className="ml-4">
                  {q.options.map((opt, oidx) => (
                    <li key={opt.id} className={opt.isCorrect ? 'font-bold text-green-700' : 'text-gray-800'}>
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
                  <div className="mt-2 text-sm text-blue-700 bg-blue-100 rounded p-2">
                    <span className="font-semibold">Explanation:</span> {q.explanation}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Marks: {q.marks} | Timer: {q.timer || 'None'} sec
                </div>
              </div>
            ))}
          </div>
        )}
        {publishError && (
          <div className="mt-4 text-red-600 font-semibold text-sm bg-red-50 border border-red-200 rounded p-2">{publishError}</div>
        )}
        <div className="flex gap-4 mt-8">
          <button
            className="bg-gray-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 shadow transition"
            onClick={() => onSave({ ...test, questions })}
          >
            Save as Draft
          </button>
          <button
            className={`bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow transition ${!canPublish ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600 hover:to-blue-800'}`}
            onClick={() => canPublish && onPublish({ ...test, questions })}
            disabled={!canPublish}
          >
            Publish
          </button>
        </div>
        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-2 text-blue-700">Test JSON Output</h3>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-64 border border-blue-100">{JSON.stringify(getTestJSON(), null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default MCQTestForm; 