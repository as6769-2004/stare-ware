import React from 'react';
import { useState } from 'react';

const statusLabels = {
  draft: 'Draft',
  published: 'Published',
  live: 'Live',
  closed: 'Closed',
};

const statusStyles = {
  draft: 'bg-yellow-100 text-yellow-700',
  published: 'bg-green-200 text-green-800',
  live: 'bg-green-500 text-white',
  closed: 'bg-gray-400 text-white',
};

// Validation function (same as in Dashboard.js)
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

const TestCard = ({ test, onEdit, onPublish, onPreview, onStatusChange, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const showPublish = test.status === 'draft';
  const showLive = test.status === 'published';
  const showClose = test.status === 'live';
  const showCopyLink = test.status === 'live';
  const testLink = `${window.location.origin}/appear-test?id=${test.id}`;

  const handleCopyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(testLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      // Fallback for older browsers or non-secure origins
      const textArea = document.createElement('textarea');
      textArea.value = testLink;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch (err) {
        alert('Failed to copy link.');
      }
      document.body.removeChild(textArea);
    }
  };
  
  // Check if test is valid for publishing
  const validationError = validateTest(test);
  const canPublish = !validationError;
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-2 transition-transform duration-200 hover:scale-[1.025] hover:shadow-2xl border border-blue-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-extrabold text-blue-800 truncate max-w-[70%]">{test.testTitle || 'Untitled Test'}</h2>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusStyles[test.status] || statusStyles.draft}`}>{statusLabels[test.status] || 'Draft'}</span>
          {showPublish && (
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
              canPublish 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {canPublish ? '✅ Valid' : '❌ Invalid'}
            </span>
          )}
        </div>
      </div>
      <div className="text-gray-600 text-sm mb-1 line-clamp-2">{test.description}</div>
      {test.publishedAt && (
        <div className="text-xs text-gray-500 mb-1">Published: {new Date(test.publishedAt).toLocaleString()}</div>
      )}
      {showPublish && !canPublish && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-2">
          <div className="font-semibold mb-1">To publish, fix:</div>
          <div className="text-xs">{validationError}</div>
        </div>
      )}
      <div className="flex gap-2 mt-2 flex-wrap">
        <button
          className="bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          className="bg-purple-500 text-white px-4 py-1.5 rounded-lg hover:bg-purple-700 font-semibold shadow-sm transition"
          onClick={onPreview}
        >
          Preview
        </button>
        {showPublish && (
          <button
            className={`px-4 py-1.5 rounded-lg font-semibold shadow-sm transition ${
              canPublish 
                ? 'bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={canPublish ? onPublish : undefined}
            disabled={!canPublish}
            title={!canPublish ? `Cannot publish: ${validationError}` : 'Publish test'}
          >
            {canPublish ? '✅ Publish' : '❌ Publish'}
          </button>
        )}
        {showLive && (
          <button
            className="bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 font-semibold shadow-sm transition"
            onClick={() => onStatusChange('live')}
          >
            Go Live
          </button>
        )}
        {showClose && (
          <button
            className="bg-gray-700 text-white px-4 py-1.5 rounded-lg hover:bg-gray-800 font-semibold shadow-sm transition"
            onClick={() => onStatusChange('closed')}
          >
            Close Test
          </button>
        )}
        {test.status === 'closed' && (
          <button
            className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-1.5 rounded-lg hover:from-green-500 hover:to-green-700 font-semibold shadow-sm transition"
            onClick={() => onStatusChange('live')}
          >
            Reopen (Go Live)
          </button>
        )}
        {showCopyLink && (
          <button
            onClick={handleCopyLink}
            className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-semibold hover:bg-blue-200"
            title="Copy test link"
          >
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
        )}
        {onDelete && (
          <button
            className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-700 font-semibold shadow-sm transition"
            onClick={onDelete}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default TestCard;
