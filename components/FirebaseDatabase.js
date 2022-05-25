import { initializeApp } from "firebase/app";
import { getDatabase, ref, update, onValue, push, child } from "firebase/database";

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
const db = getDatabase(app);

export function write(path, data) {
    const key = push(child(ref(db), path)).key;
    const updates = {};
    updates[`/${path}/${key}`] = data;
    update(ref(db), updates);
}

export function read(path, callback) {
    const _ref = ref(db, path);
    onValue(_ref, (snapshot) => {
        callback(snapshot.val());
    });
}