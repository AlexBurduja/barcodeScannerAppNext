
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { doc, getFirestore, setDoc } from "firebase/firestore"
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqW-_-lcN88WekVY5RWPMJVi0k1l5AxJM",
  authDomain: "mwoodekobarcodeapp.firebaseapp.com",
  projectId: "mwoodekobarcodeapp",
  storageBucket: "mwoodekobarcodeapp.appspot.com",
  messagingSenderId: "630122803975",
  appId: "1:630122803975:web:19b13ac4aa8ba831548ba2",
  measurementId: "G-LT7T5DP22V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)