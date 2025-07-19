// src/App.js
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import CreateTest from "./pages/CreateTest";
import AppearTest from "./pages/AppearTest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create-test" element={<CreateTest />} />
        <Route path="/appear-test" element={<AppearTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
