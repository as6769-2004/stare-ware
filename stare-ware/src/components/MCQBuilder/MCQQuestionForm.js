import React from 'react';
import MediaUploader from './MediaUploader';
import MCQOptionInput from './MCQOptionInput';

const MCQQuestionForm = ({ question, onChange, onRemove }) => {
  const questionTypes = [
    { value: 'single', label: 'Single Correct' },
    { value: 'multiple', label: 'Multiple Correct' },
  ];

  // Add option (max 6)
  const handleAddOption = () => {
    if (question.options.length < 6) {
      onChange({
        ...question,
        options: [
          ...question.options,
          { id: `opt${Date.now()}`, text: '', media: null, isCorrect: false },
        ],
      });
    }
  };

  // Remove option (min 2)
  const handleRemoveOption = (idx) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== idx);
      onChange({ ...question, options: newOptions });
    }
  };

  // Update option
  const handleChangeOption = (idx, newOpt) => {
    const newOptions = [...question.options];
    newOptions[idx] = newOpt;
    onChange({ ...question, options: newOptions });
  };

  // Change correct answer(s)
  const handleCorrectChange = (idx, checked) => {
    let newOptions;
    if (question.type === 'single') {
      newOptions = question.options.map((opt, i) => ({ ...opt, isCorrect: i === idx }));
    } else {
      newOptions = question.options.map((opt, i) => i === idx ? { ...opt, isCorrect: checked } : opt);
    }
    onChange({ ...question, options: newOptions });
  };

  // Media upload for question
  const handleQuestionMedia = (media) => {
    onChange({ ...question, questionMedia: media });
  };

  // Validation
  const errors = {};
  if (!question.questionText.trim()) errors.questionText = 'Question text is required.';
  if (question.options.length < 2) errors.options = 'At least 2 options are required.';
  if (question.options.length > 6) errors.options = 'No more than 6 options allowed.';
  if (!question.options.every(opt => opt.text.trim())) errors.optionsText = 'All options must have text.';
  if (!question.options.some(opt => opt.isCorrect)) errors.correct = 'Mark at least one correct answer.';
  if (!question.marks || question.marks < 1) errors.marks = 'Marks must be at least 1.';
  if (question.timer && (isNaN(question.timer) || question.timer < 0)) errors.timer = 'Timer must be a positive number.';

  return (
    <div>
      <div className="mb-2">
        <label className="font-semibold">Question Text</label>
        <textarea
          className="w-full border rounded px-2 py-1 mt-1"
          placeholder="Enter question text"
          value={question.questionText}
          onChange={e => onChange({ ...question, questionText: e.target.value })}
        />
        {errors.questionText && <div className="text-red-600 text-xs mt-1">{errors.questionText}</div>}
        <MediaUploader
          media={question.questionMedia}
          onUpload={handleQuestionMedia}
          accept="image/*,audio/*,video/*"
        />
      </div>
      <div className="mb-2 flex gap-4 items-center">
        <label className="font-semibold">Type:</label>
        <select
          value={question.type}
          onChange={e => onChange({ ...question, type: e.target.value })}
          className="border rounded px-2 py-1"
        >
          {questionTypes.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-2">
        <label className="font-semibold">Options</label>
        {question.options.map((opt, idx) => (
          <MCQOptionInput
            key={opt.id}
            option={opt}
            index={idx}
            type={question.type}
            onChange={newOpt => handleChangeOption(idx, newOpt)}
            onRemove={() => handleRemoveOption(idx)}
            onCorrectChange={checked => handleCorrectChange(idx, checked)}
            disableRemove={question.options.length <= 2}
            media={opt.media}
            onMediaChange={media => handleChangeOption(idx, { ...opt, media })}
          />
        ))}
        <button
          className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          onClick={handleAddOption}
          disabled={question.options.length >= 6}
          type="button"
        >
          + Add Option
        </button>
        {errors.options && <div className="text-red-600 text-xs mt-1">{errors.options}</div>}
        {errors.optionsText && <div className="text-red-600 text-xs mt-1">{errors.optionsText}</div>}
        {errors.correct && <div className="text-red-600 text-xs mt-1">{errors.correct}</div>}
      </div>
      <div className="mb-2">
        <label className="font-semibold">Explanation (optional)</label>
        <textarea
          className="w-full border rounded px-2 py-1 mt-1"
          placeholder="Explanation for the correct answer"
          value={question.explanation}
          onChange={e => onChange({ ...question, explanation: e.target.value })}
        />
      </div>
      <div className="mb-2 flex gap-4 items-center">
        <input
          type="number"
          min={1}
          value={question.marks}
          onChange={e => onChange({ ...question, marks: Number(e.target.value) })}
          className="border rounded px-2 py-1"
          placeholder="Marks"
        />
        {errors.marks && <div className="text-red-600 text-xs mt-1">{errors.marks}</div>}
        <input
          type="number"
          min={0}
          value={question.timer || ''}
          onChange={e => onChange({ ...question, timer: Number(e.target.value) })}
          className="border rounded px-2 py-1"
          placeholder="Timer (sec)"
        />
        {errors.timer && <div className="text-red-600 text-xs mt-1">{errors.timer}</div>}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          onClick={onRemove}
          type="button"
        >
          Remove Question
        </button>
      </div>
    </div>
  );
};

export default MCQQuestionForm; 