export function getItem(key) {
    if (typeof window !== "undefined") {
        return JSON.parse(localStorage.getItem(key) || '{}');
    }
    return null;
}

export function setItem(key, data) {
    if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(data));
    }
}

export function removeItem(key) {
    if (typeof window !== "undefined") {
        localStorage.removeItem(key);
    }
}
