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

// Cached instance
let dbInstance: Firestore | null = null;
let initError: Error | null = null;

/**
 * Lazy initialize Firebase - only initializes when first accessed
 * Uses a getter pattern to defer initialization until actually needed
 */
function getDb(): Firestore {
  if (dbInstance) return dbInstance;
  if (initError) throw initError;

  try {
    // Check if already initialized
    const apps = getApps();
    const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    initError = error instanceof Error ? error : new Error("Firebase initialization failed");
    throw initError;
  }
}

// Export a getter that lazily initializes Firebase
// This prevents module-level crashes on Netlify
export const db = new Proxy({} as Firestore, {
  get(target, prop) {
    const instance = getDb();
    return instance[prop as keyof Firestore];
  }
});

/**
 * Check if Firebase is available and working
 */
export function isFirebaseAvailable(): boolean {
  return initError === null;
}

/**
 * Get any Firebase initialization error
 */
export function getFirebaseError(): Error | null {
  return initError;
}
