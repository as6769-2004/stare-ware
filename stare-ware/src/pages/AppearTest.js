import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { getTestById } from '../utils/firestore';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AppearTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);
  const testTimerRef = useRef(null);

  // State management
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [user, setUser] = useState(null);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [showGetReady, setShowGetReady] = useState(true);
  const [cameraError, setCameraError] = useState('');
  // Popup state for warnings and auto-submit
  const [popup, setPopup] = useState({ open: false, message: '', autoSubmit: false });

  // Load test data from Firestore
  useEffect(() => {
    const testId = new URLSearchParams(location.search).get('id');
    if (!testId) {
      navigate('/');
      return;
    }
    getTestById(testId).then(foundTest => {
      if (foundTest) {
        setTest(foundTest);
        setTimeLeft(foundTest.timeLimit || 3600);
      } else {
        navigate('/');
      }
    }).catch(() => navigate('/'));
  }, [location.search, navigate]);

  // Require sign-in before appearing for test
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        localStorage.setItem('redirectAfterSignIn', location.pathname + location.search);
        navigate('/');
      }
    });
    return () => unsub();
  }, [navigate, location]);

  // After sign-in, redirect back to intended test
  useEffect(() => {
    if (user) {
      const redirect = localStorage.getItem('redirectAfterSignIn');
      if (redirect) {
        localStorage.removeItem('redirectAfterSignIn');
        if (redirect !== location.pathname + location.search) {
          navigate(redirect, { replace: true });
        }
      }
    }
  }, [user, navigate, location]);

  // Force fullscreen and block right-click/dev tools on mount
  useEffect(() => {
    // Request fullscreen
    const goFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {}
    };
    goFullscreen();

    // Block right-click/context menu
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);

    // Block dev tools and forbidden keys
    const handleKeyDown = (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S, Ctrl+Shift+C
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['U', 'S'].includes(e.key.toUpperCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);

    // Clean up on unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Force light mode for this page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Camera handlers
  const handleUserMedia = () => {
    setCameraReady(true);
    setShowCameraPopup(false);
    setCameraError('');
  };

  const handleUserMediaError = (error) => {
    setCameraReady(false);
    setShowCameraPopup(true);
    setCameraError(error?.message || 'Camera not available or permission denied.');
  };

  // Load face-api.js model on mount
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    };
    loadModels();
  }, []);

  // Move handleTestComplete above handleSuspiciousActivity
  const handleTestComplete = useCallback(() => {
    setTestCompleted(true);
    setTestStarted(false);
    let correctAnswers = 0;
    test.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    const finalScore = Math.round((correctAnswers / test.questions.length) * 100);
    setScore(finalScore);
    // Save test result (localStorage for now)
    const testResult = {
      testId: test.id,
      testTitle: test.testTitle,
      score: finalScore,
      totalQuestions: test.questions.length,
      correctAnswers,
      completedAt: new Date().toISOString(),
      answers
    };
    const existingResults = JSON.parse(localStorage.getItem('test_results') || '[]');
    existingResults.push(testResult);
    localStorage.setItem('test_results', JSON.stringify(existingResults));
  }, [test, answers]);

  const handleSuspiciousActivity = useCallback((reason) => {
    if (fullscreenWarnings >= 2) {
      setPopup({ open: true, message: '🚫 Test auto-submitted due to multiple violations', autoSubmit: true });
      setTimeout(() => {
        setPopup({ open: false, message: '', autoSubmit: false });
        handleTestComplete();
      }, 2000);
    } else {
      setPopup({ open: true, message: `⚠️ WARNING: ${reason}\nThis is your ${fullscreenWarnings + 1} warning. Test will auto-submit after 3 warnings.`, autoSubmit: false });
      setTimeout(() => setPopup({ open: false, message: '', autoSubmit: false }), 2000);
    }
  }, [fullscreenWarnings, handleTestComplete]);

  // Face detection interval (only if camera is ready)
  useEffect(() => {
    if (!cameraReady) return;
    let lastFaceDetected = true;
    let warningTimeout = null;
    const interval = setInterval(async () => {
      if (webcamRef.current && webcamRef.current.video) {
        const result = await faceapi.detectSingleFace(
          webcamRef.current.video,
          new faceapi.TinyFaceDetectorOptions()
        );
        setFaceDetected(!!result);
        if (!result && lastFaceDetected && testStarted) {
          // Face just lost, start warning timer
          warningTimeout = setTimeout(() => {
            handleSuspiciousActivity('Face not detected');
          }, 1000); // 1 second delay
        } else if (result && warningTimeout) {
          // Face detected again, clear warning timer
          clearTimeout(warningTimeout);
          warningTimeout = null;
        }
        lastFaceDetected = !!result;
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (warningTimeout) clearTimeout(warningTimeout);
    };
  }, [cameraReady, testStarted, handleSuspiciousActivity]);

  // Anti-cheating checks
  useEffect(() => {
    if (!testStarted) return;
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted) {
        handleSuspiciousActivity('Tab switching detected');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testStarted, handleSuspiciousActivity]);

  // Test timer
  useEffect(() => {
    if (testStarted && timeLeft > 0) {
      testTimerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTestComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (testTimerRef.current) {
        clearInterval(testTimerRef.current);
      }
    };
  }, [testStarted, timeLeft, handleTestComplete]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = document.fullscreenElement !== null;
      if (!isFullscreenNow && testStarted) {
        setFullscreenWarnings(prev => {
          const newWarnings = prev + 1;
          if (newWarnings >= 3) {
            handleSuspiciousActivity('Maximum fullscreen warnings exceeded');
          }
          return newWarnings;
        });
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [testStarted, handleSuspiciousActivity]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const startTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setTestStarted(true);
    } catch (error) {
      alert('Please enable fullscreen mode to start the test');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return <div className="p-8 text-center">Please sign in to appear for the test.</div>;
  }
  if (!test) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">
              Test Completed!
            </h1>
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {score}%
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Your Score: {score} out of 100
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Test Details</h3>
                <p className="text-gray-600 dark:text-gray-400">Title: {test.testTitle}</p>
                <p className="text-gray-600 dark:text-gray-400">Questions: {test.questions.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Your Answers</h3>
                <p className="text-gray-600 dark:text-gray-400">Answered: {Object.keys(answers).length}</p>
                <p className="text-gray-600 dark:text-gray-400">Skipped: {test.questions.length - Object.keys(answers).length}</p>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Show 'Get Ready' modal before requesting camera access
  if (showGetReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Get Ready to Allow Camera</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            This test requires access to your camera for proctoring. When you click Continue, your browser will ask for camera permission. Please click <b>Allow</b> in the popup.
          </p>
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            onClick={() => setShowGetReady(false)}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }
  // Camera access popup/modal
  if (showCameraPopup) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Camera Access Needed</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            This test requires access to your camera for proctoring. Please allow camera access in your browser settings and reload the page.
          </p>
          {cameraError && (
            <div className="text-red-600 mt-2">
              <b>Error:</b> {cameraError}
            </div>
          )}
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            onClick={() => window.location.reload()}
          >
            Reload & Retry
          </button>
        </div>
      </div>
    );
  }
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">
              {test.testTitle}
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Camera Setup */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Camera Setup
                </h2>
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    width="100%"
                    height="auto"
                    className="rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    onUserMedia={handleUserMedia}
                    onUserMediaError={handleUserMediaError}
                  />
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded text-sm font-medium ${
                    faceDetected 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                  }`}>
                    {faceDetected ? '✅ Face Detected' : '❌ No Face'}
                  </div>
                </div>
                {!cameraReady && !showCameraPopup && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      Please allow camera access to continue
                    </p>
                  </div>
                )}
              </div>
              {/* Test Rules */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  Test Rules
                </h2>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠️</span>
                    <span>Face must be visible at all times</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠️</span>
                    <span>Fullscreen mode required</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠️</span>
                    <span>No tab switching allowed</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500 mt-1">⚠️</span>
                    <span>3 warnings = auto-submission</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500 mt-1">⏱️</span>
                    <span>Time limit: {formatTime(timeLeft)}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-500 mt-1">📝</span>
                    <span>Questions: {test.questions.length}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={startTest}
                disabled={!cameraReady || !faceDetected}
                className={`px-8 py-3 rounded-lg font-medium transition ${
                  cameraReady && faceDetected
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {!cameraReady ? 'Setting up camera...' : 
                 !faceDetected ? 'Please position your face in camera' : 
                 'Start Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Popup Modal for Warnings and Auto-Submit */}
      {popup.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">{popup.autoSubmit ? 'Test Auto-Submitted' : 'Warning'}</h2>
            <p className="mb-6 text-gray-600 whitespace-pre-line">{popup.message}</p>
            {!popup.autoSubmit && (
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
                onClick={() => setPopup({ open: false, message: '', autoSubmit: false })}
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
      {/* Minimal Header: Profile, App Name, Timer */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-blue-700">Stare-Ware</span>
            {user && (
              <span className="text-base font-semibold text-gray-700">{user.displayName || user.email}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              ⏱️ {formatTime(timeLeft)}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              faceDetected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {faceDetected ? '✅ Face Detected' : '❌ No Face'}
            </div>
            {fullscreenWarnings > 0 && (
              <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                ⚠️ {fullscreenWarnings}/3
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Always-on Camera Feed */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 50, width: 180, height: 135, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: '2px solid #3b82f6', overflow: 'hidden' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          width={180}
          height={135}
          className="rounded-lg"
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
        />
      </div>
      {/* Test Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          {test.questions[currentQuestion] && (
            <div className="space-y-6">
              {/* Question */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {test.questions[currentQuestion].questionText}
                </h2>
                {test.questions[currentQuestion].explanation && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      {test.questions[currentQuestion].explanation}
                    </p>
                  </div>
                )}
              </div>
              {/* Options */}
              <div className="space-y-3">
                {test.questions[currentQuestion].options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[currentQuestion] === optionIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion}`}
                      value={optionIndex}
                      checked={answers[currentQuestion] === optionIndex}
                      onChange={() => handleAnswerSelect(currentQuestion, optionIndex)}
                      className="mr-3"
                    />
                    <span className="text-gray-800 dark:text-gray-200">
                      {option.text}
                    </span>
                  </label>
                ))}
              </div>
              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    currentQuestion === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  Previous
                </button>
                <div className="flex space-x-2">
                  {test.questions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                        index === currentQuestion
                          ? 'bg-blue-500 text-white'
                          : answers[index] !== undefined
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                {currentQuestion < test.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleTestComplete}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
                  >
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppearTest; 