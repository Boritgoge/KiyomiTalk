import app from "./Firebase";
import { getDatabase, ref, update, onValue, push, child, remove } from "firebase/database";

// Get database instance directly without caching
const getDb = () => {
    try {
        return getDatabase(app);
    } catch (error) {
        console.error("Error getting database instance:", error);
        // Return a new database instance if error
        return getDatabase(app);
    }
};

export function read(path, callback, options = {}) {
    try {
        const db = getDb();
        const _ref = ref(db, path);
        
        if (options.once) {
            // 한 번만 읽기
            const { get } = require("firebase/database");
            get(_ref).then((snapshot) => {
                callback(snapshot.val());
            });
            return () => {}; // 빈 unsubscribe 함수 반환
        } else {
            // 실시간 구독
            return onValue(_ref, (snapshot) => {
                callback(snapshot.val());
            });
        }
    } catch (error) {
        console.error("Firebase read error:", error);
        callback(null);
        return () => {};
    }
}

export function write(path, data) {
    try {
        const db = getDb();
        const key = push(child(ref(db), path)).key;
        const updates = {};
        updates[`/${path}/${key}`] = { key, ...data};
        update(ref(db), updates);
    } catch (error) {
        console.error("Firebase write error:", error);
    }
}

export function updateByPath(path, data) {
    try {
        const db = getDb();
        const updates = {};
        updates[`${path}`] = data;
        update(ref(db), updates);
    } catch (error) {
        console.error("Firebase updateByPath error:", error);
    }
}

export function readOnce(path, callback) {
    try {
        const db = getDb();
        const _ref = ref(db, path);
        return onValue(_ref, (snapshot) => {
            callback(snapshot.val());
        }, {
            onlyOnce: true
        });
    } catch (error) {
        console.error("Firebase readOnce error:", error);
        callback(null);
    }
}

export function toList(data) {
    return Object.keys(data || {}).map(key => data[key]);
}

export function toListWithKey(data) {
    return Object.keys(data || {}).map(key => ({ key, ...data[key] }));
}

export function removeByPath(path) {
    try {
        const db = getDb();
        return remove(ref(db, path));
    } catch (error) {
        console.error("Firebase removeByPath error:", error);
    }
}

export default getDb()