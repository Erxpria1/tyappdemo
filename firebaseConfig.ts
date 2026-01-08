import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSA5B66H-0BL0LcpFs0FVmo_02MX7twI8",
  authDomain: "tyapp2-1d8f9.firebaseapp.com",
  projectId: "tyapp2-1d8f9",
  storageBucket: "tyapp2-1d8f9.firebasestorage.app",
  messagingSenderId: "147317426980",
  appId: "1:147317426980:web:49bbcd69b2553cf48581b1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
