import React, { useState } from 'react';
import MCQQuestionList from './MCQQuestionList';

const MCQTestForm = () => {
  const [testTitle, setTestTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [questions, setQuestions] = useState([]);

  // Placeholder for handling save, publish, etc.
  const handleSave = () => {
    // TODO: Implement save logic
    alert('Save as draft!');
  };

  const handlePublish = () => {
    // TODO: Implement publish logic
    alert('Publish!');
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Create MCQ Test</h1>
      <div className="mb-4">
        <input
          type="text"
          className="w-full border rounded px-2 py-1 mb-2"
          placeholder="Test Title"
          value={testTitle}
          onChange={e => setTestTitle(e.target.value)}
        />
        <textarea
          className="w-full border rounded px-2 py-1"
          placeholder="Test Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        {/* TODO: Add TagSelector for tags */}
      </div>
      <MCQQuestionList questions={questions} setQuestions={setQuestions} />
      <div className="flex gap-4 mt-6">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          onClick={handleSave}
        >
          Save as Draft
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handlePublish}
        >
          Publish
        </button>
      </div>
    </div>
  );
};

export default MCQTestForm; 