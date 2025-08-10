import app from "../../../../components/common/Firebase"
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { FirebaseDatabase } from "./FirebaseDatabase"

const storage = getStorage(app)

// Create the file metadata
/** @type {any} */
const metadata = {
  contentType: 'image/jpeg'
}

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

export const FirebaseStore = {
  uploadFile: async (file) => {
    const storageRef = ref(storage, 'images/' + uuidv4())
    return uploadBytesResumable(storageRef, file, metadata)
  },
  
  sendMessage: async (roomId, user, text) => {
    const messageData = {
      text,
      uid: user.uid,
      displayName: user.displayName,
      timestamp: Date.now()
    }
    
    FirebaseDatabase.write(`rooms/${roomId}/messages`, messageData)
  }
}