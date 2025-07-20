// stare-ware/src/firebase.js

import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // If you're using Firebase Auth

// Firebase configuration for your project
const firebaseConfig = {
  apiKey: "AIzaSyCvxF3ajrikdQy5l142CPXL3hN1pK_La7U",
  authDomain: "stare-ware.firebaseapp.com",
  projectId: "stare-ware",
  storageBucket: "stare-ware.firebasestorage.app",
  messagingSenderId: "766045651373",
  appId: "1:766045651373:web:06e0300a4e0e5774226124",
  measurementId: "G-6XGKPZ78C2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app); // Export auth if you're using it

export default app;
