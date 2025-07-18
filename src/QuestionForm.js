import React, { useState } from "react";

export default function QuestionForm() {
  const [questions, setQuestions] = useState([
    { type: "mcq", text: "", options: ["", "", ""], answers: [], timer: "" }
  ]);
  const [globalTimer, setGlobalTimer] = useState("");

  function handleQuestionChange(idx, value) {
    const updated = [...questions];
    updated[idx].text = value;
    setQuestions(updated);
  }

  function handleOptionChange(qIdx, oIdx, value) {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = value;
    setQuestions(updated);
  }

  function handleAnswerToggle(qIdx, oIdx) {
    const updated = [...questions];
    const answers = updated[qIdx].answers || [];
    if (answers.includes(oIdx)) {
      updated[qIdx].answers = answers.filter(a => a !== oIdx);
    } else {
      updated[qIdx].answers = [...answers, oIdx];
    }
    setQuestions(updated);
  }

  function handleTypeChange(qIdx, value) {
    const updated = [...questions];
    updated[qIdx].type = value;
    if (value === "mcq") {
      updated[qIdx].options = ["", "", ""];
      updated[qIdx].answers = [];
      delete updated[qIdx].codeAnswer;
    } else {
      delete updated[qIdx].options;
      delete updated[qIdx].answers;
      updated[qIdx].codeAnswer = "";
    }
    setQuestions(updated);
  }

  function handleCodeAnswerChange(qIdx, value) {
    const updated = [...questions];
    updated[qIdx].codeAnswer = value;
    setQuestions(updated);
  }

  function handleTimerChange(qIdx, value) {
    const updated = [...questions];
    updated[qIdx].timer = value;
    setQuestions(updated);
  }

  function addQuestion() {
    setQuestions([
      ...questions,
      { type: "mcq", text: "", options: ["", "", ""], answers: [], timer: "" }
    ]);
  }

  function removeQuestion(idx) {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  function addOption(qIdx) {
    const updated = [...questions];
    if (updated[qIdx].options.length < 5) {
      updated[qIdx].options.push("");
      setQuestions(updated);
    }
  }

  function removeOption(qIdx, oIdx) {
    const updated = [...questions];
    if (updated[qIdx].options.length > 2) {
      updated[qIdx].options.splice(oIdx, 1);
      // Remove from answers if present
      updated[qIdx].answers = (updated[qIdx].answers || []).filter(a => a !== oIdx).map(a => (a > oIdx ? a - 1 : a));
      setQuestions(updated);
    }
  }

  function exportQuestions() {
    const jsContent =
      "// Exported questions for StareWare\n" +
      "exports.test = " +
      JSON.stringify(
        {
          globalTimer,
          questions
        },
        null,
        2
      ) +
      ";\n";
    const blob = new Blob([jsContent], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-4 text-blue-700">Build Your Test</h2>
      <div className="mb-6">
        <label className="font-semibold mr-2">Global Timer (minutes):</label>
        <input
          type="number"
          min="0"
          className="border rounded px-2 py-1 w-24"
          placeholder="(optional)"
          value={globalTimer}
          onChange={e => setGlobalTimer(e.target.value)}
        />
        <span className="text-gray-500 ml-2 text-xs">
          (Leave blank for no global timer)
        </span>
      </div>
      {questions.map((q, qIdx) => (
        <div key={qIdx} className="mb-6 border-b pb-4">
          <div className="flex items-center mb-2">
            <span className="font-semibold mr-2">Q{qIdx + 1}:</span>
            <select
              className="border rounded px-2 py-1 mr-2"
              value={q.type}
              onChange={e => handleTypeChange(qIdx, e.target.value)}
            >
              <option value="mcq">MCQ</option>
              <option value="code">Coding</option>
            </select>
            <input
              type="text"
              className="border rounded px-2 py-1 w-full"
              placeholder="Enter question text"
              value={q.text}
              onChange={e => handleQuestionChange(qIdx, e.target.value)}
            />
            <button
              className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => removeQuestion(qIdx)}
              disabled={questions.length === 1}
            >
              Remove
            </button>
          </div>
          <div className="ml-6">
            {q.type === "mcq" && (
              <div>
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      name={`answer-${qIdx}-${oIdx}`}
                      checked={q.answers && q.answers.includes(oIdx)}
                      onChange={() => handleAnswerToggle(qIdx, oIdx)}
                      className="mr-2"
                    />
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-3/4"
                      placeholder={`Option ${oIdx + 1}`}
                      value={opt}
                      onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                    />
                    <button
                      className="ml-2 px-2 py-1 bg-red-400 text-white rounded hover:bg-red-600"
                      onClick={() => removeOption(qIdx, oIdx)}
                      disabled={q.options.length <= 2}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
                  onClick={() => addOption(qIdx)}
                  disabled={q.options.length >= 5}
                >
                  Add Option
                </button>
                <div className="text-xs text-gray-500 mt-1">(Mark all correct answers. Max 5 options.)</div>
              </div>
            )}
            {q.type === "code" && (
              <textarea
                className="border rounded px-2 py-1 w-full h-24 mt-2"
                placeholder="(Optional) Reference code answer or instructions"
                value={q.codeAnswer || ""}
                onChange={e => handleCodeAnswerChange(qIdx, e.target.value)}
              />
            )}
          </div>
          <div className="mt-2">
            <label className="text-sm font-medium mr-2">Timer for this question (minutes):</label>
            <input
              type="number"
              min="0"
              className="border rounded px-2 py-1 w-20"
              placeholder="(optional)"
              value={q.timer || ""}
              onChange={e => handleTimerChange(qIdx, e.target.value)}
            />
            <span className="text-gray-400 ml-2 text-xs">
              (Overrides global timer if set)
            </span>
          </div>
        </div>
      ))}
      <div className="flex gap-4 mt-4">
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={addQuestion}
        >
          Add Question
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={exportQuestions}
        >
          Export as JS File
        </button>
      </div>
    </div>
  );
} 