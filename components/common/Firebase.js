import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyC6bjzsZjvjZ7MQtmwdhw8K8KZAeQI530k",
    authDomain: "fcm-simulator-f6908.firebaseapp.com",
    databaseURL: "https://fcm-simulator-f6908-default-rtdb.firebaseio.com",
    projectId: "fcm-simulator-f6908",
    storageBucket: "fcm-simulator-f6908.appspot.com",
    messagingSenderId: "800381183411",
    appId: "1:800381183411:web:87a64b0ab047ef39d597c6",
    measurementId: "G-LSTN6W98V4"
};

let app;

try {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
        app = getApp();
    } else {
        app = initializeApp(firebaseConfig);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Try to get existing app if initialization fails
    try {
        app = getApp();
    } catch (getError) {
        // If all else fails, initialize a new app
        app = initializeApp(firebaseConfig);
    }
}

export default app;