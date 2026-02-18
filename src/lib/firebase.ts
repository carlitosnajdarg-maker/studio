
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "@/firebase/config";

// Usamos la configuración centralizada de src/firebase/config.ts
const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

let app;
let auth: any = null;
let db: any = null;
const googleProvider = new GoogleAuthProvider();

if (isConfigValid) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
  }
}

export { auth, db, googleProvider, isConfigValid };
