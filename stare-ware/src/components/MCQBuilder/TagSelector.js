import React from 'react';

const subjects = ['Math', 'Science', 'English', 'History'];
const topics = ['Algebra', 'Biology', 'Grammar', 'World War II'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const TagSelector = ({ tags, onChange }) => {
  const handleMultiSelect = (e, key) => {
    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
    onChange({ ...tags, [key]: selected });
  };
  const handleSingleSelect = (e, key) => {
    onChange({ ...tags, [key]: e.target.value });
  };
  return (
    <div className="flex gap-4 flex-wrap">
      <div>
        <label className="block font-semibold">Subject</label>
        <select
          multiple
          className="border rounded px-2 py-1"
          value={tags.subject || []}
          onChange={e => handleMultiSelect(e, 'subject')}
        >
          {subjects.map(sub => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold">Topic</label>
        <select
          multiple
          className="border rounded px-2 py-1"
          value={tags.topic || []}
          onChange={e => handleMultiSelect(e, 'topic')}
        >
          {topics.map(top => (
            <option key={top} value={top}>{top}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-semibold">Difficulty</label>
        <select
          className="border rounded px-2 py-1"
          value={tags.difficulty || ''}
          onChange={e => handleSingleSelect(e, 'difficulty')}
        >
          <option value="">Select</option>
          {difficulties.map(diff => (
            <option key={diff} value={diff}>{diff}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TagSelector; 