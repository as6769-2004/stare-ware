import React from 'react';
import MediaUploader from './MediaUploader';

const MCQOptionInput = ({ option, index, type, onChange, onRemove, onCorrectChange, disableRemove, media, onMediaChange }) => {
  const hasError = !option.text || !option.text.trim();
  
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2">
        {type === 'single' ? (
          <input
            type="radio"
            name={`correctOption${index}`}
            checked={option.isCorrect}
            onChange={() => onCorrectChange(true)}
            className="text-blue-600"
          />
        ) : (
          <input
            type="checkbox"
            checked={option.isCorrect}
            onChange={e => onCorrectChange(e.target.checked)}
            className="text-blue-600"
          />
        )}
        <input
          type="text"
          className={`flex-1 border rounded px-2 py-1 ${
            hasError ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          placeholder={`Option ${index + 1}${hasError ? ' (required)' : ''}`}
          value={option.text}
          onChange={e => onChange({ ...option, text: e.target.value })}
        />
        <MediaUploader
          media={media}
          onUpload={onMediaChange}
          accept="image/*,audio/*,video/*"
        />
        <button
          className="bg-red-400 text-white px-2 py-1 rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onRemove}
          disabled={disableRemove}
          type="button"
        >
          Remove
        </button>
      </div>
      {hasError && (
        <div className="text-red-600 text-xs mt-1 ml-6">
          Option text is required
        </div>
      )}
    </div>
  );
};

export default MCQOptionInput; 