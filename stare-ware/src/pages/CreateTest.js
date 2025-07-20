import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MCQTestForm } from '../components/MCQBuilder';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  // Check test title
  if (!test.testTitle || !test.testTitle.trim()) {
    return 'Test title is required.';
  }
  
  // Check if there are any questions
  if (!test.questions || test.questions.length === 0) {
    return 'At least one question is required.';
  }
  
  // Validate each question
  for (const [i, q] of test.questions.entries()) {
    const questionNumber = i + 1;
    
    // Check question text
    if (!q.questionText || !q.questionText.trim()) {
      return `Question ${questionNumber}: Question text is required.`;
    }
    
    // Check options array exists and has correct length
    if (!q.options || q.options.length < 2 || q.options.length > 6) {
      return `Question ${questionNumber}: Must have 2-6 options.`;
    }
    
    // Check all options have text
    for (const [optIdx, opt] of q.options.entries()) {
      if (!opt.text || !opt.text.trim()) {
        return `Question ${questionNumber}, Option ${optIdx + 1}: Option text is required.`;
      }
    }
    
    // Check at least one option is marked as correct
    if (!q.options.some(opt => opt.isCorrect)) {
      return `Question ${questionNumber}: Mark at least one correct answer.`;
    }
    
    // Check marks
    if (!q.marks || q.marks < 1) {
      return `Question ${questionNumber}: Marks must be at least 1.`;
    }
    
    // Check timer if provided
    if (q.timer !== undefined && q.timer !== '' && (isNaN(q.timer) || q.timer < 0)) {
      return `Question ${questionNumber}: Timer must be a positive number.`;
    }
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
  const [userEmail, setUserEmail] = useState('');

  // Listen for auth user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserEmail(u?.email || '');
    });
    return () => unsub();
  }, []);

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
    const newTest = { ...updatedTest, status, ownerEmail: userEmail };
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
      userEmail={userEmail}
    />
  );
};

export default CreateTest;
