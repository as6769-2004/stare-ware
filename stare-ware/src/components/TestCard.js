import React from 'react';

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

const TestCard = ({ test, onEdit, onPublish, onPreview, onStatusChange }) => {
  const showPublish = test.status === 'draft';
  const showLive = test.status === 'published';
  const showClose = test.status === 'live';
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-2 transition-transform duration-200 hover:scale-[1.025] hover:shadow-2xl border border-blue-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-extrabold text-blue-800 truncate max-w-[70%]">{test.testTitle || 'Untitled Test'}</h2>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${statusStyles[test.status] || statusStyles.draft}`}>{statusLabels[test.status] || 'Draft'}</span>
      </div>
      <div className="text-gray-600 text-sm mb-1 line-clamp-2">{test.description}</div>
      {test.publishedAt && (
        <div className="text-xs text-gray-500 mb-1">Published: {new Date(test.publishedAt).toLocaleString()}</div>
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
            className="bg-gradient-to-r from-green-400 to-green-600 text-white px-4 py-1.5 rounded-lg hover:from-green-500 hover:to-green-700 font-semibold shadow-sm transition"
            onClick={onPublish}
          >
            Publish
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
      </div>
    </div>
  );
};

export default TestCard;
