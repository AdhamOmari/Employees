// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAKXEZaZm5Yu5WMnpfW0t_svrRbE5RHHaE",
  authDomain: "employees-d19aa.firebaseapp.com",
  projectId: "employees-d19aa",
  storageBucket: "employees-d19aa.firebasestorage.app",
  messagingSenderId: "997402580294",
  appId: "1:997402580294:web:7e6512c92c704b83fcc147",
  measurementId: "G-2GQG3Z7E1L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };