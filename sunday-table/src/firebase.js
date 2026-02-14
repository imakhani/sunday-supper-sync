// ─────────────────────────────────────────────────────────────
//  STEP 1: Paste your Firebase project config here
//  Get it from: Firebase Console → Project Settings → Your apps
// ─────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app'
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAdqLacgH-7KKVIghSauikjRAz0ay0Imtk",
  authDomain: "sunday-table.firebaseapp.com",
  projectId: "sunday-table",
  storageBucket: "sunday-table.firebasestorage.app",
  messagingSenderId: "367604045477",
  appId: "1:367604045477:web:18345008870413633cdf4c",
  measurementId: "G-4D7W4Q12SK"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Enable offline persistence so the app works without internet
try {
  enableMultiTabIndexedDbPersistence(db)
} catch (e) {
  // Silently ignore if already enabled or unsupported
}
