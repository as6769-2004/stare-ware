// src/components/Dashboard.js
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Test Platform Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <button
          onClick={() => navigate("/create-test")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 rounded-xl shadow-md text-xl"
        >
          ➕ Create a Test
        </button>
        <button
          onClick={() => navigate("/appear-test")}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl shadow-md text-xl"
        >
          📝 Appear for a Test
        </button>
      </div>
    </div>
  );
}
