import React, { useRef, useState, useEffect } from "react";

// Format seconds as mm:ss for the timer
function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  return `${min}:${sec}`;
}

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [testRunning, setTestRunning] = useState(false);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [status, setStatus] = useState("Idle");
  const [faceDetected, setFaceDetected] = useState(false);
  const [angles, setAngles] = useState({ right: null, left: null });
  const [dataLog, setDataLog] = useState([]);
  const [downloadReady, setDownloadReady] = useState(false);

  // Timer logic
  useEffect(() => {
    if (testRunning) {
      setStatus("Running");
      const id = setInterval(() => setTimer((t) => t + 1), 1000);
      setIntervalId(id);
    } else {
      clearInterval(intervalId);
      setIntervalId(null);
      if (timer > 0) setStatus("Stopped");
    }
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [testRunning]);

  // MediaPipe FaceMesh setup
  useEffect(() => {
    if (!testRunning) return;
    let faceMesh, camera;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    function onResults(results) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let rightAngle = null,
        leftAngle = null,
        detected = false;

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        detected = true;
        const landmarks = results.multiFaceLandmarks[0];
        window.drawConnectors(ctx, landmarks, window.FACEMESH_TESSELATION, {
          color: "#90caf9",
          lineWidth: 1,
        });
        window.drawConnectors(ctx, landmarks, window.FACEMESH_RIGHT_EYE, {
          color: "#e53935",
          lineWidth: 2,
        });
        window.drawConnectors(ctx, landmarks, window.FACEMESH_LEFT_EYE, {
          color: "#43a047",
          lineWidth: 2,
        });

        // Right eye angle (landmarks 33 and 133)
        const rOuter = landmarks[33],
          rInner = landmarks[133];
        if (rOuter && rInner) {
          const dx = rInner.x - rOuter.x;
          const dy = rInner.y - rOuter.y;
          rightAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        }
        // Left eye angle (landmarks 263 and 362)
        const lOuter = landmarks[263],
          lInner = landmarks[362];
        if (lOuter && lInner) {
          const dx = lInner.x - lOuter.x;
          const dy = lInner.y - lOuter.y;
          leftAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
        }
      }
      setFaceDetected(detected);
      setAngles({ right: rightAngle, left: leftAngle });

      // Log data
      if (testRunning) {
        setDataLog((log) => [
          ...log,
          {
            time: formatTime(timer),
            right: rightAngle !== null ? rightAngle.toFixed(2) : "",
            left: leftAngle !== null ? leftAngle.toFixed(2) : "",
            face: detected ? "Yes" : "No",
          },
        ]);
      }
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
        setStatus("Error: Webcam not accessible");
        setTestRunning(false);
      });

    return () => {
      if (camera) camera.stop();
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line
  }, [testRunning]);

  // Reset data when test starts
  useEffect(() => {
    if (testRunning) {
      setTimer(0);
      setDataLog([]);
      setDownloadReady(false);
    }
  }, [testRunning]);

  // Download CSV
  function downloadData() {
    if (!dataLog.length) return;
    const csvRows = [
      "Time,Right Eye Angle,Left Eye Angle,Face",
      ...dataLog.map(
        (row) => `${row.time},${row.right},${row.left},${row.face}`
      ),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stareware_test_data.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full flex flex-col items-center">
      <header className="flex flex-col items-center mb-4">
        <img src="/logo.svg" alt="StareWare Logo" className="w-14 h-14 mb-2" />
        <h1 className="text-2xl font-bold text-blue-700">StareWare Test Browser</h1>
      </header>
      <section className="mb-4 text-center max-w-md">
        <p className="text-gray-700">
          Welcome! This browser-based app lets you run real-time face and eye detection tests for surveillance or behavioral experiments. All you need is a webcam—no extra software required.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Click <b>Start Test</b> to begin. Your face and gaze will be tracked in real time. You can download the session data when finished.
        </p>
      </section>
      <section className="flex flex-col items-center w-full max-w-md">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => setTestRunning(true)}
            className={`px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition ${testRunning ? "hidden" : ""}`}
          >
            Start Test
          </button>
          <button
            onClick={() => {
              setTestRunning(false);
              setDownloadReady(true);
            }}
            className={`px-4 py-2 bg-gray-400 text-white rounded-lg shadow hover:bg-gray-500 transition ${!testRunning ? "hidden" : ""}`}
          >
            Stop Test
          </button>
          <span className="text-sm font-semibold text-gray-700 ml-2">{status}</span>
          <span className="text-sm text-gray-600 ml-2">{formatTime(timer)}</span>
        </div>
        <div className="relative w-80 h-60 mb-2">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-gray-400"
          ></video>
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          ></canvas>
          <div
            className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold shadow ${
              faceDetected ? "bg-green-600" : "bg-red-500"
            } text-white`}
          >
            {faceDetected ? "Face Detected" : "No Face"}
          </div>
        </div>
        <div className="mb-2 text-lg font-semibold text-gray-800">
          Right Eye Angle: {angles.right !== null ? angles.right.toFixed(2) : "N/A"}°,{" "}
          Left Eye Angle: {angles.left !== null ? angles.left.toFixed(2) : "N/A"}°
        </div>
        <div className="w-full overflow-x-auto mb-2">
          <table className="min-w-full text-xs text-left border border-gray-300 rounded-lg bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Right Eye Angle</th>
                <th className="px-2 py-1">Left Eye Angle</th>
                <th className="px-2 py-1">Face</th>
              </tr>
            </thead>
            <tbody>
              {dataLog.map((row, i) => (
                <tr key={i}>
                  <td className="px-2 py-1">{row.time}</td>
                  <td className="px-2 py-1">{row.right}</td>
                  <td className="px-2 py-1">{row.left}</td>
                  <td className="px-2 py-1">{row.face}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={downloadData}
          className={`px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition ${downloadReady ? "" : "hidden"}`}
        >
          Download Data
        </button>
      </section>
      <footer className="mt-6 text-xs text-gray-400">
        StareWare &copy; 2025 | For research and learning
      </footer>
    </div>
  );
}
