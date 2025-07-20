// src/App.js
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard";
import CreateTest from "./pages/CreateTest";
import AppearTest from "./pages/AppearTest";
import Profile from "./pages/Profile";
import TopNav from "./components/TopNav";

function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const location = useLocation();

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Only show TopNav if not on /appear-test
  const showTopNav = !location.pathname.startsWith('/appear-test');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 font-sans transition-colors">
      {showTopNav && <TopNav darkMode={darkMode} setDarkMode={setDarkMode} />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-test" element={<CreateTest />} />
        <Route path="/appear-test" element={<AppearTest />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default function AppWithRouter() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
