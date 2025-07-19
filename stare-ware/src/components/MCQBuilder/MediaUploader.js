import React, { useRef } from 'react';

const MediaUploader = ({ media, onUpload, accept = 'image/*,audio/*,video/*' }) => {
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpload({ url, type: file.type, name: file.name, file });
    }
  };

  const handleRemove = () => {
    onUpload(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="my-2">
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        onChange={handleFileChange}
        className="block mb-2"
      />
      {media && (
        <div className="mb-2">
          {media.type.startsWith('image') && (
            <img src={media.url} alt="media" className="max-h-32 mb-1" />
          )}
          {media.type.startsWith('audio') && (
            <audio controls src={media.url} className="mb-1" />
          )}
          {media.type.startsWith('video') && (
            <video controls src={media.url} className="max-h-32 mb-1" />
          )}
          <button
            className="bg-red-400 text-white px-2 py-1 rounded hover:bg-red-500"
            onClick={handleRemove}
            type="button"
          >
            Remove Media
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaUploader; 