import React from "react";
import QuestionForm from "./QuestionForm";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <header className="mt-8 mb-4">
        <h1 className="text-3xl font-bold text-blue-700">StareWare Test Builder</h1>
        <p className="text-gray-600 mt-2 text-center max-w-lg">
          Create your own test questions and export them as a JS file for use in the main StareWare app. Add, edit, and remove questions and options as needed.
        </p>
      </header>
      <QuestionForm />
      <footer className="mt-8 text-xs text-gray-400">StareWare &copy; 2025 | Test Builder</footer>
    </div>
  );
}