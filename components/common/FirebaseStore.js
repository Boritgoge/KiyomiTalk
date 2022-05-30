import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const storage = getStorage();

// Create the file metadata
/** @type {any} */
const metadata = {
  contentType: 'image/jpeg'
};

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}
export const uploadImage = async (file) => {
    const storageRef = ref(storage, 'images/' + uuidv4());
    return uploadBytesResumable(storageRef, file, metadata);
}