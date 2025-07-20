import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';

const TESTS_KEY = 'mcq_tests';

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

  // Load test data
  useEffect(() => {
    const testId = new URLSearchParams(location.search).get('id');
    if (!testId) {
      navigate('/');
      return;
    }

    const saved = localStorage.getItem(TESTS_KEY);
    if (saved) {
      try {
        const tests = JSON.parse(saved);
        const foundTest = tests.find(t => t.id === testId);
        if (foundTest) {
          setTest(foundTest);
          setTimeLeft(foundTest.timeLimit || 3600); // Default 1 hour
        } else {
          navigate('/');
        }
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [location.search, navigate]);

  // Camera setup
  useEffect(() => {
    const setupCamera = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640, 
            height: 480,
            facingMode: 'user'
          } 
        });
        setCameraReady(true);
        
        // Simple face detection using canvas analysis
        const checkFaceDetection = () => {
          if (webcamRef.current && webcamRef.current.video) {
            const video = webcamRef.current.video;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Simple skin tone detection as basic face detection
            let skinPixels = 0;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Basic skin tone detection
              if (r > 95 && g > 40 && b > 20 && 
                  Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                  Math.abs(r - g) > 15 && r > g && r > b) {
                skinPixels++;
              }
            }
            
            const skinPercentage = skinPixels / (data.length / 4);
            setFaceDetected(skinPercentage > 0.1); // 10% skin pixels threshold
          }
        };
        
        const interval = setInterval(checkFaceDetection, 1000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Camera access failed:', error);
        setCameraReady(false);
      }
    };
    
    setupCamera();
  }, []);

  const handleTestComplete = useCallback(() => {
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
  }, [test, answers]);

  const handleSuspiciousActivity = useCallback((reason) => {
    alert(`⚠️ WARNING: ${reason}\nThis is your ${fullscreenWarnings + 1} warning. Test will auto-submit after 3 warnings.`);
    
    if (fullscreenWarnings >= 2) {
      setTimeout(() => {
        alert('🚫 Test auto-submitted due to multiple violations');
        handleTestComplete();
      }, 2000);
    }
  }, [fullscreenWarnings, handleTestComplete]);

  // Anti-cheating checks
  useEffect(() => {
    if (!testStarted) return;

    // Check for face detection
    if (!faceDetected && cameraReady) {
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
  }, [testStarted, faceDetected, cameraReady, handleSuspiciousActivity]);

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
                
                {!cameraReady ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-yellow-800 dark:text-yellow-200">
                      Please allow camera access to continue
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      width="100%"
                      height="auto"
                      className="rounded-lg border-2 border-gray-200 dark:border-gray-700"
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-sm font-medium ${
                      faceDetected 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    }`}>
                      {faceDetected ? '✅ Face Detected' : '❌ No Face'}
                    </div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {test.testTitle}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestion + 1} of {test.questions.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Face Detection Status */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                faceDetected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
              }`}>
                {faceDetected ? '✅ Face Detected' : '❌ No Face'}
              </div>
              
              {/* Timer */}
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                ⏱️ {formatTime(timeLeft)}
              </div>
              
              {/* Warnings */}
              {fullscreenWarnings > 0 && (
                <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                  ⚠️ {fullscreenWarnings}/3
                </div>
              )}
            </div>
          </div>
        </div>
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
