import { initializeApp } from "firebase/app";
const firebaseConfig = {
    apiKey: "AIzaSyC6bjzsZjvjZ7MQtmwdhw8K8KZAeQI530k",
    authDomain: "fcm-simulator-f6908.firebaseapp.com",
    projectId: "fcm-simulator-f6908",
    storageBucket: "fcm-simulator-f6908.appspot.com",
    messagingSenderId: "800381183411",
    appId: "1:800381183411:web:87a64b0ab047ef39d597c6",
    measurementId: "G-LSTN6W98V4"
};

const app = initializeApp(firebaseConfig);

export default app;