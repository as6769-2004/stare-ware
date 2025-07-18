import React, { useState, useRef, useEffect } from "react";

export default function App() {
  const [test, setTest] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [multiSelected, setMultiSelected] = useState([]);
  const [faceDetected, setFaceDetected] = useState(true); // Surveillance state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showWarning, setShowWarning] = useState(false);

  // Surveillance: Setup MediaPipe Face Mesh when    test is loaded
  useEffect(() => {
    if (!test) return;
    let faceMesh, camera;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let animationId;

    function onResults(results) {
      if (!canvas || !video) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let detected = false;
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        detected = true;
        const landmarks = results.multiFaceLandmarks[0];
        if (window.drawConnectors) {
          window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
            color: "#90caf9",
            lineWidth: 1,
          });
          window.drawConnectors(ctx, landmarks, window.FACEMESH_RIGHT_EYE, {
            color: "#e53930",
            lineWidth: 2,
          });
          window.drawConnectors(ctx, landmarks, window.FACEMESH_LEFT_EYE, {
            color: "#43a047",
            lineWidth: 2,
          });
        }
      }
      setFaceDetected(detected);
      setShowWarning(!detected);
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          faceMesh = new window.FaceMesh({
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });
          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          faceMesh.onResults(onResults);

          camera = new window.Camera(video, {
            onFrame: async () => {
              await faceMesh.send({ image: video });
            },
            width: video.videoWidth,
            height: video.videoHeight,
          });
          camera.start();
        };
      })
      .catch(() => {
        setFaceDetected(false);
        setShowWarning(true);
      });

    return () => {
      if (camera) camera.stop();
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, [test]);

  // Handle test file upload
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const exports = {};
      try {
        // eslint-disable-next-line no-new-func
        new Function("exports", event.target.result)(exports);
        if (exports.test) {
          setTest(exports.test);
          setCurrent(0);
          setAnswers([]);
        } else {
          alert("Invalid test file: missing 'test' export.");
        }
      } catch (err) {
        alert("Failed to load test file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  if (!test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold mb-4 text-blue-700">StareWare Test</h1>
        <p className="mb-4 text-gray-700">Choose a test JS file exported from the builder:</p>
        <input
          type="file"
          accept=".js"
          onChange={handleFileChange}
          className="mb-4"
        />
        <div className="text-xs text-gray-500 max-w-md text-center">
          (You can create and export a test file using the StareWare Test Builder.)
        </div>
      </div>
    );
  }

  const questions = test.questions;
  const q = questions[current];

  function handleMCQAnswer(idx) {
    setAnswers([...answers, idx]);
    setCurrent(current + 1);
  }

  function handleMCQMultiAnswer(selected) {
    setAnswers([...answers, selected]);
    setCurrent(current + 1);
    setMultiSelected([]);
  }

  function handleCodeAnswer(code) {
    setAnswers([...answers, code]);
    setCurrent(current + 1);
  }

  if (current >= questions.length) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-bold mb-4 text-blue-700">Test complete!</h2>
        <div className="mb-2">Thank you for taking the test.</div>
        <div className="text-xs text-gray-500">You can close this tab or upload another test file.</div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 relative">
      {/* Surveillance video/canvas overlay */}
      <div className="absolute top-0 left-0 w-64 h-48 border-2 border-gray-400 rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold shadow ${
            faceDetected ? "bg-green-600" : "bg-red-500"
          } text-white`}
        >
          {faceDetected ? "Face Detected" : "No Face"}
        </div>
      </div>
      {showWarning && (
        <div className="mt-52 mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <b>Warning:</b> Face not detected! Please stay in view of the camera to continue the test.
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4 text-blue-700">StareWare Test</h1>
      <div className="mb-4 font-semibold">Q{current + 1}: {q.text}</div>
      {q.type === "mcq" && (
        <div>
          {q.answers && q.answers.length > 1 ? (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!faceDetected) return; // Prevent answering if no face
                handleMCQMultiAnswer(multiSelected);
              }}
            >
              {q.options.map((opt, i) => (
                <label key={i} className="block mb-2">
                  <input
                    type="checkbox"
                    checked={multiSelected.includes(i)}
                    onChange={e => {
                      if (e.target.checked) {
                        setMultiSelected([...multiSelected, i]);
                      } else {
                        setMultiSelected(multiSelected.filter(idx => idx !== i));
                      }
                    }}
                    className="mr-2"
                    disabled={!faceDetected}
                  />
                  {opt}
                </label>
              ))}
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!faceDetected}
              >
                Next
              </button>
            </form>
          ) : (
            q.options.map((opt, i) => (
              <button
                key={i}
                className="block w-full text-left px-4 py-2 mb-2 bg-gray-100 rounded hover:bg-blue-100"
                onClick={() => faceDetected && handleMCQAnswer(i)}
                disabled={!faceDetected}
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
      {q.type === "code" && (
        <div>
          <textarea
            className="w-full border rounded p-2 mb-2"
            rows={6}
            placeholder="Write your code here..."
            onBlur={e => faceDetected && handleCodeAnswer(e.target.value)}
            disabled={!faceDetected}
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => {
              if (!faceDetected) return;
              handleCodeAnswer(document.querySelector('textarea').value);
            }}
            disabled={!faceDetected}
          >
            Next
          </button>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-500">
        {q.timer ? `Timer for this question: ${q.timer} min` : test.globalTimer ? `Global timer: ${test.globalTimer} min` : ""}
      </div>
    </div>
  );
}