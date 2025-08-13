import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { LocalStorage } from '../storage/LocalStorage'
import { userState } from '../recoil/atoms'
import { useRecoilState } from 'recoil'

export const LoginChecker = () => {
  const router = useRouter()
  const [_, setUser] = useRecoilState(userState)
  
  useEffect(() => {
    const user = LocalStorage.getItem('cachedUser')
    if (user) {
      setUser(user)
      // Don't redirect if user exists
    } else if (router.pathname !== '/login' && router.pathname !== '/tools' && !router.pathname.includes('/invite')) {
      // Only redirect to login if not already on login page, tools page, or invite page
      router.push('/login')
    }
  }, [router, setUser])
  
  return null
}