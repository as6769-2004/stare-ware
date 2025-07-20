import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';

const TESTS_KEY = 'mcq_tests';

const AppearTest = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const testTimerRef = useRef(null);
  
  // State management
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Face recognition and anti-cheating
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [faceRecognitionReady, setFaceRecognitionReady] = useState(false);
  
  // UI states
  const [showRules, setShowRules] = useState(true);
  const [showFaceSetup, setShowFaceSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load test data from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const testId = params.get('id');
    
    if (!testId) {
      setError('No test ID provided');
      setLoading(false);
      return;
    }

    const savedTests = localStorage.getItem(TESTS_KEY);
    if (savedTests) {
      try {
        const tests = JSON.parse(savedTests);
        const foundTest = tests.find(t => t.id === testId);
        
        if (foundTest && foundTest.status === 'live') {
          setTest(foundTest);
          setTimeLeft(foundTest.duration * 60); // Convert minutes to seconds
        } else {
          setError('Test not found or not available');
        }
      } catch (err) {
        setError('Error loading test');
      }
    } else {
      setError('No tests available');
    }
    setLoading(false);
  }, [location]);

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.faceExpressionNet.loadFromUri('/models')
        ]);
        setFaceRecognitionReady(true);
      } catch (error) {
        console.error('Error loading face recognition models:', error);
        // Fallback: continue without face recognition
        setFaceRecognitionReady(false);
      }
    };
    
    loadModels();
  }, []);

  // Face detection loop
  const detectFace = useCallback(async () => {
    if (!webcamRef.current || !canvasRef.current || !faceRecognitionReady) return;

    try {
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      
      if (video.readyState === 4) {
        const detections = await faceapi.detectSingleFace(
          video,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks().withFaceExpressions();

        if (detections) {
          setFaceDetected(true);
          setFaceConfidence(detections.detection.score);
          
          // Draw face detection box
          const displaySize = { width: video.videoWidth, height: video.videoHeight };
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
        } else {
          setFaceDetected(false);
          setFaceConfidence(0);
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [faceRecognitionReady]);

  // Start face detection
  useEffect(() => {
    if (testStarted && faceRecognitionReady) {
      intervalRef.current = setInterval(detectFace, 100);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [testStarted, faceRecognitionReady, detectFace]);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = document.fullscreenElement !== null;
      setIsFullscreen(isFullscreenNow);
      
      if (isFullscreenNow && testStarted) {
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
  }, [testStarted]);

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
  }, [testStarted, timeLeft]);

  // Anti-cheating checks
  useEffect(() => {
    if (!testStarted) return;

    // Check for face detection
    if (!faceDetected && faceRecognitionReady) {
      setTimeout(() => {
        if (!faceDetected) {
          handleSuspiciousActivity('Face not detected');
        }
      }, 5000); // 5 seconds grace period
    }

    // Check for tab switching
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted) {
        handleSuspiciousActivity('Tab switching detected');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [testStarted, faceDetected, faceRecognitionReady]);

  const handleSuspiciousActivity = (reason) => {
    setSuspiciousActivity(true);
    alert(`⚠️ WARNING: ${reason}\nThis is your ${fullscreenWarnings + 1} warning. Test will auto-submit after 3 warnings.`);
    
    if (fullscreenWarnings >= 2) {
      setTimeout(() => {
        alert('🚫 Test auto-submitted due to multiple violations');
        handleTestComplete();
      }, 2000);
    }
  };

  const handleTestComplete = () => {
    setTestCompleted(true);
    setTestStarted(false);
    
    // Calculate score
    let correctAnswers = 0;
    test.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    
    const finalScore = Math.round((correctAnswers / test.questions.length) * 100);
    setScore(finalScore);
    
    // Save test result
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
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleStartTest = () => {
    setShowRules(false);
    setShowFaceSetup(true);
  };

  const handleFaceSetupComplete = () => {
    setShowFaceSetup(false);
    setTestStarted(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Test Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The test you're looking for doesn't exist or is not available.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Rules and Regulations Screen
  if (showRules) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Test Rules & Regulations
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please read all rules carefully before starting the test
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                  ⚠️ Important Rules
                </h3>
                <ul className="space-y-2 text-red-700 dark:text-red-300">
                  <li>• Face recognition is mandatory - keep your face visible at all times</li>
                  <li>• Do not switch tabs or applications during the test</li>
                  <li>• Do not exit fullscreen mode</li>
                  <li>• Maximum 3 warnings before auto-submission</li>
                  <li>• Test will auto-submit when time expires</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                  📋 Test Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700 dark:text-blue-300">
                  <div>
                    <strong>Test Title:</strong> {test.testTitle}
                  </div>
                  <div>
                    <strong>Duration:</strong> {test.duration} minutes
                  </div>
                  <div>
                    <strong>Questions:</strong> {test.questions.length}
                  </div>
                  <div>
                    <strong>Total Marks:</strong> {test.questions.reduce((sum, q) => sum + (q.marks || 1), 0)}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
                  ✅ What You Can Do
                </h3>
                <ul className="space-y-2 text-green-700 dark:text-green-300">
                  <li>• Take your time to read questions carefully</li>
                  <li>• Review your answers before submitting</li>
                  <li>• Use the timer to manage your time</li>
                  <li>• Contact support if you encounter technical issues</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleStartTest}
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition text-lg font-semibold"
              >
                I Understand - Start Test
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Face Setup Screen
  if (showFaceSetup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Face Recognition Setup
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Please position your face in the camera view
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  className="rounded-lg"
                  width={400}
                  height={300}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0"
                  width={400}
                  height={300}
                />
              </div>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                  faceDetected 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {faceDetected ? '✅ Face Detected' : '❌ No Face Detected'}
                </span>
              </div>
              
              {faceDetected && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Confidence: {Math.round(faceConfidence * 100)}%
                  </p>
                </div>
              )}

              <button
                onClick={handleFaceSetupComplete}
                disabled={!faceDetected}
                className={`px-8 py-3 rounded-lg text-lg font-semibold transition ${
                  faceDetected
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {faceDetected ? 'Start Test' : 'Please Position Your Face'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test Completed Screen
  if (testCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">
              {score >= 70 ? '🎉' : score >= 50 ? '😊' : '📚'}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Test Completed!
            </h1>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4">
                Your Score: {score}%
              </h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Correct Answers:</strong> {Math.round((score / 100) * test.questions.length)}/{test.questions.length}
                </div>
                <div>
                  <strong>Test Duration:</strong> {test.duration} minutes
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
              >
                Back to Dashboard
              </button>
              
              <button
                onClick={() => window.print()}
                className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Print Results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Test Interface
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Timer and Status */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {test.testTitle}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Face Detection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  faceDetected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {faceDetected ? 'Face Detected' : 'No Face'}
                </span>
              </div>
              
              {/* Warnings */}
              {fullscreenWarnings > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    Warnings: {fullscreenWarnings}/3
                  </span>
                </div>
              )}
              
              {/* Timer */}
              <div className="bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-lg">
                <span className="text-red-800 dark:text-red-200 font-bold">
                  ⏰ {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Question {currentQuestion + 1}
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              {test.questions[currentQuestion].questionText}
            </p>
            
            {/* Options */}
            <div className="space-y-3">
              {test.questions[currentQuestion].options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    answers[currentQuestion] === optionIndex
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={optionIndex}
                    checked={answers[currentQuestion] === optionIndex}
                    onChange={() => handleAnswerSelect(currentQuestion, optionIndex)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
                    answers[currentQuestion] === optionIndex
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {answers[currentQuestion] === optionIndex && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                currentQuestion === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {test.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-8 h-8 rounded-full text-sm font-semibold transition ${
                    index === currentQuestion
                      ? 'bg-blue-500 text-white'
                      : answers[index] !== undefined
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                if (currentQuestion === test.questions.length - 1) {
                  handleTestComplete();
                } else {
                  setCurrentQuestion(prev => Math.min(test.questions.length - 1, prev + 1));
                }
              }}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              {currentQuestion === test.questions.length - 1 ? 'Submit Test' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden webcam for face detection */}
      <div className="hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          width={320}
          height={240}
        />
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
        />
      </div>
    </div>
  );
};

export default AppearTest;
