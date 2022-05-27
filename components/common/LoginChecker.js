// import { onAuthStateChanged } from "firebase/auth"
import { useEffect } from 'react';
import { useRouter } from 'next/router'
import { getItem } from '/components/common/LocalStorage'
import { userState } from '../../recoil/atoms'
import { useRecoilState } from 'recoil'
const LoginChecker = () => {
    const router = useRouter()
    const [_, setUser] = useRecoilState(userState)
    useEffect(() => {
        const user = getItem('cachedUser')
        if(user) {
            setUser(user)
        } else {
            router.push('/login')
        }
    }, [])
    return <></>
}
export default LoginChecker