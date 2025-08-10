import app from "../../../../components/common/Firebase"
import { getAuth, signInWithPopup, signOut, GithubAuthProvider, GoogleAuthProvider, onAuthStateChanged as firebaseOnAuthStateChanged } from "firebase/auth"

const auth = getAuth(app)

export const FirebaseAuth = {
  signInWithGithub: async () => {
    return signInWithPopup(auth, new GithubAuthProvider())
      .then((result) => result.user)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        console.log(`${errorCode}: ${errorMessage}`)
      })
  },

  signInWithGoogle: async () => {
    return signInWithPopup(auth, new GoogleAuthProvider())
      .then((result) => result.user)
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        console.log(`${errorCode}: ${errorMessage}`)
      })
  },
  
  signOut: async () => {
    return signOut(auth)
      .then(() => {
        // Clear cached user data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cachedUser')
          localStorage.removeItem('currentRoomId')
        }
        return true
      })
      .catch((error) => {
        console.error('Sign out error:', error)
        return false
      })
  },
  
  onAuthStateChanged: (callback) => {
    return firebaseOnAuthStateChanged(auth, callback)
  }
}

