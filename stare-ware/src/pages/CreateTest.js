import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MCQTestForm } from '../components/MCQBuilder';

const TESTS_KEY = 'mcq_tests';

function getQueryId(search) {
  const params = new URLSearchParams(search);
  return params.get('id');
}

const emptyTest = {
  id: '',
  testTitle: '',
  description: '',
  tags: {},
  questions: [],
  status: 'draft',
};

function validateTest(test) {
  if (!test.testTitle.trim()) return 'Test title is required.';
  if (!test.questions || test.questions.length === 0) return 'At least one question is required.';
  for (const [i, q] of test.questions.entries()) {
    if (!q.questionText.trim()) return `Question ${i + 1} text is required.`;
    if (!q.options || q.options.length < 2 || q.options.length > 6) return `Question ${i + 1} must have 2-6 options.`;
    if (!q.options.every(opt => opt.text.trim())) return `All options in question ${i + 1} must have text.`;
    if (!q.options.some(opt => opt.isCorrect)) return `Mark at least one correct answer in question ${i + 1}.`;
    if (!q.marks || q.marks < 1) return `Marks must be at least 1 in question ${i + 1}.`;
    if (q.timer && (isNaN(q.timer) || q.timer < 0)) return `Timer must be a positive number in question ${i + 1}.`;
  }
  return '';
}

const CreateTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [test, setTest] = useState(emptyTest);
  const [isLoaded, setIsLoaded] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [canPublish, setCanPublish] = useState(false);

  // Load test for editing or start new
  useEffect(() => {
    const id = getQueryId(location.search);
    const saved = localStorage.getItem(TESTS_KEY);
    if (id && saved) {
      try {
        const tests = JSON.parse(saved);
        const found = tests.find(t => t.id === id);
        if (found) {
          setTest(found);
          setIsLoaded(true);
          return;
        }
      } catch {}
    }
    setTest({ ...emptyTest, id: Date.now().toString() });
    setIsLoaded(true);
  }, [location.search]);

  // Recalculate error and canPublish on every test change
  useEffect(() => {
    const error = validateTest(test);
    setPublishError(error);
    setCanPublish(!error);
  }, [test]);

  // Save or update test in localStorage
  const handleSave = (updatedTest, status = 'draft') => {
    const saved = localStorage.getItem(TESTS_KEY);
    let tests = [];
    if (saved) {
      try {
        tests = JSON.parse(saved);
      } catch {}
    }
    const idx = tests.findIndex(t => t.id === updatedTest.id);
    const newTest = { ...updatedTest, status };
    if (idx >= 0) {
      tests[idx] = newTest;
    } else {
      tests.push(newTest);
    }
    localStorage.setItem(TESTS_KEY, JSON.stringify(tests));
    setTest(newTest);
    alert(status === 'published' ? 'Test published!' : 'Test saved as draft!');
    if (status === 'published') navigate('/');
  };

  // Strict publish handler with validation
  const handlePublish = (updatedTest) => {
    const error = validateTest(updatedTest);
    if (error) {
      setPublishError(error);
      setCanPublish(false);
      return;
    }
    setPublishError('');
    setCanPublish(true);
    handleSave(updatedTest, 'published');
  };

  if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

  return (
    <MCQTestForm
      test={test}
      setTest={setTest}
      onSave={t => handleSave(t, 'draft')}
      onPublish={handlePublish}
      publishError={publishError}
      canPublish={canPublish}
    />
  );
};

export default CreateTest;
