import React from 'react';
import MCQQuestionForm from './MCQQuestionForm';

const MCQQuestionList = ({ questions, setQuestions }) => {
  // Add a new blank question
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        type: 'single',
        questionText: '',
        questionMedia: null,
        options: [
          { id: 'opt1', text: '', media: null, isCorrect: false },
          { id: 'opt2', text: '', media: null, isCorrect: false },
        ],
        explanation: '',
        tags: [],
        marks: 1,
        timer: '',
      },
    ]);
  };

  // Remove a question by index
  const handleRemoveQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  // Move question up or down
  const handleMoveQuestion = (idx, direction) => {
    const newQuestions = [...questions];
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    [newQuestions[idx], newQuestions[targetIdx]] = [newQuestions[targetIdx], newQuestions[idx]];
    setQuestions(newQuestions);
  };

  // Update a question
  const handleChangeQuestion = (idx, newQuestion) => {
    const newQuestions = [...questions];
    newQuestions[idx] = newQuestion;
    setQuestions(newQuestions);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Questions</h2>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          onClick={handleAddQuestion}
        >
          + Add Question
        </button>
      </div>
      {questions.length === 0 && <p className="text-gray-500">No questions yet.</p>}
      {questions.map((q, idx) => (
        <div key={q.id} className="mb-6 border rounded shadow p-3 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Q{idx + 1}</span>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => handleMoveQuestion(idx, -1)}
                disabled={idx === 0}
              >↑</button>
              <button
                className="px-2 py-1 bg-gray-200 rounded"
                onClick={() => handleMoveQuestion(idx, 1)}
                disabled={idx === questions.length - 1}
              >↓</button>
              <button
                className="px-2 py-1 bg-red-500 text-white rounded"
                onClick={() => handleRemoveQuestion(idx)}
              >Remove</button>
            </div>
          </div>
          <MCQQuestionForm
            question={q}
            onChange={newQ => handleChangeQuestion(idx, newQ)}
            onRemove={() => handleRemoveQuestion(idx)}
          />
          {/* TODO: Add preview toggle here */}
        </div>
      ))}
    </div>
  );
};

export default MCQQuestionList; 