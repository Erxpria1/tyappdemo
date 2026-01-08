import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSA5B66H-0BL0LcpFs0FVmo_02MX7twI8",
  authDomain: "tyapp2-1d8f9.firebaseapp.com",
  projectId: "tyapp2-1d8f9",
  storageBucket: "tyapp2-1d8f9.firebasestorage.app",
  messagingSenderId: "147317426980",
  appId: "1:147317426980:web:49bbcd69b2553cf48581b1"
};

let dbInstance: Firestore | null = null;
let initError: Error | null = null;

try {
  // Initialize Firebase
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization failed:", error);
  initError = error instanceof Error ? error : new Error("Firebase initialization failed");
}

// Export the db instance (will be null if initialization failed)
// The app should handle null/undefined db gracefully
export const db: Firestore = dbInstance!;

/**
 * Check if Firebase is available and working
 */
export function isFirebaseAvailable(): boolean {
  return initError === null && dbInstance !== null;
}

/**
 * Get any Firebase initialization error
 */
export function getFirebaseError(): Error | null {
  return initError;
}
