import app from "./Firebase";
import { getAuth, signInWithPopup, GithubAuthProvider } from "firebase/auth"

export const signInWithGithub = async () => {
    return signInWithPopup(getAuth(app), new GithubAuthProvider())
        .then((result) => result.user)
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(`${errorCode}: ${errorMessage}`);
        });
}

