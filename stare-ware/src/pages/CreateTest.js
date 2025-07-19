import React, { useState } from 'react';

const CreateTest = () => {
  const [questions, setQuestions] = useState([]);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);

  const handleOptionChange = (value, idx) => {
    const newOptions = [...options];
    newOptions[idx] = value;
    setOptions(newOptions);
  };

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (
      questionText.trim() &&
      options.every(opt => opt.trim()) &&
      correctIndex >= 0 &&
      correctIndex < options.length
    ) {
      setQuestions([
        ...questions,
        {
          question: questionText,
          options: [...options],
          correct: correctIndex,
        },
      ]);
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create MCQ Test</h2>
      <form onSubmit={handleAddQuestion} className="space-y-4 bg-white p-4 rounded shadow">
        <div>
          <label className="block font-semibold mb-1">Question</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Options</label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center mb-2">
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1 mr-2"
                value={opt}
                onChange={e => handleOptionChange(e.target.value, idx)}
                required
              />
              <label className="flex items-center">
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctIndex === idx}
                  onChange={() => setCorrectIndex(idx)}
                  className="mr-1"
                />
                Correct
              </label>
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Question
        </button>
      </form>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Questions Added</h3>
        {questions.length === 0 && <p className="text-gray-500">No questions added yet.</p>}
        <ul className="space-y-4">
          {questions.map((q, idx) => (
            <li key={idx} className="border rounded p-3 bg-gray-50">
              <div className="font-semibold">Q{idx + 1}: {q.question}</div>
              <ul className="ml-4 mt-1">
                {q.options.map((opt, oidx) => (
                  <li key={oidx} className={q.correct === oidx ? 'font-bold text-green-700' : ''}>
                    {String.fromCharCode(65 + oidx)}. {opt} {q.correct === oidx && '(Correct)'}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CreateTest;
