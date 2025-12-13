// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDaY-5NjueHlRJ9lh7PtkYf0WkoUbMmbuk",
  authDomain: "fitnesstracker-ddbb6.firebaseapp.com",
  projectId: "fitnesstracker-ddbb6",
  storageBucket: "fitnesstracker-ddbb6.firebasestorage.app",
  messagingSenderId: "450033326322",
  appId: "1:450033326322:web:df33123b10a0089d72586b",
  measurementId: "G-4P0JLJZX0J"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);np