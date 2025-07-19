import React from 'react';
import MediaUploader from './MediaUploader';

const MCQOptionInput = ({ option, index, type, onChange, onRemove, onCorrectChange, disableRemove, media, onMediaChange }) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      {type === 'single' ? (
        <input
          type="radio"
          name={`correctOption${index}`}
          checked={option.isCorrect}
          onChange={() => onCorrectChange(true)}
        />
      ) : (
        <input
          type="checkbox"
          checked={option.isCorrect}
          onChange={e => onCorrectChange(e.target.checked)}
        />
      )}
      <input
        type="text"
        className="flex-1 border rounded px-2 py-1"
        placeholder={`Option ${index + 1}`}
        value={option.text}
        onChange={e => onChange({ ...option, text: e.target.value })}
      />
      <MediaUploader
        media={media}
        onUpload={onMediaChange}
        accept="image/*,audio/*,video/*"
      />
      <button
        className="bg-red-400 text-white px-2 py-1 rounded hover:bg-red-500"
        onClick={onRemove}
        disabled={disableRemove}
        type="button"
      >
        Remove
      </button>
    </div>
  );
};

export default MCQOptionInput; 