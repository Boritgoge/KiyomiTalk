import app from "./Firebase";
import { getDatabase, ref, update, onValue, push, child } from "firebase/database";

const db = getDatabase(app);


export function read(path, callback) {
    const _ref = ref(db, path);
    return onValue(_ref, (snapshot) => {
        callback(snapshot.val());
    });
}

export function write(path, data) {
    const key = push(child(ref(db), path)).key;
    const updates = {};
    updates[`/${path}/${key}`] = { key, ...data};
    update(ref(db), updates);
}

export function updateByPath(path, data) {
    const key = push(child(ref(db), path)).key;
    const updates = {};
    updates[`${path}`] = data;
    update(ref(db), updates);
}

export function readOnce(path, callback) {
    const _ref = ref(db, path);
    return onValue(_ref, (snapshot) => {
        callback(snapshot.val());
    }, {
        onlyOnce: true
    });
}

export function toList(data) {
    return Object.keys(data || {}).map(key => data[key]);
}

export function toListWithKey(data) {
    return Object.keys(data || {}).map(key => ({ key, ...data[key] }));
}

export default db