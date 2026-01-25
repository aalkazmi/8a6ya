import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOg9OljjLnmOkCrB7GLXUFoOY3ArMf6ig",
  authDomain: "a6ya-47c4a.firebaseapp.com",
  projectId: "a6ya-47c4a",
  storageBucket: "a6ya-47c4a.firebasestorage.app",
  messagingSenderId: "718401213991",
  appId: "1:718401213991:web:fa8f6fc53bb46dd3eea002"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);