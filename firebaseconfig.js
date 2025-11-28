import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// --- UPDATED IMPORTS to combine both versions ---

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration with your actual keys

const firebaseConfig = {
  apiKey: "AIzaSyC-kWIQ8EAT6vm0N9SVAJljamUxR9ngZt4",
  authDomain: "raithamitra-a523b.firebaseapp.com",
  projectId: "raithamitra-a523b",
  storageBucket: "raithamitra-a523b.firebasestorage.app", 
  messagingSenderId: "581374349093",
  appId: "1:581374349093:web:a6b26db5c291ad6a5394cc",
  measurementId: "G-H7EX7SN8EW"
};
// --- Robust initialization logic to prevent re-initialization errors ---
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// --- Initialize Auth with persistence to keep users logged in ---
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// Export the services so other files in your app can use them
export { auth, db, functions, storage };
