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
    
    if (user && user.uid) {
      // 정상적인 사용자 (게스트 제외)
      setUser(user)
    } else {
      // 로그인이 필요한 페이지에서만 리다이렉트
      const publicPaths = ['/login', '/tools', '/', '/editor']
      const isPublicPath = publicPaths.includes(router.pathname) || 
                          router.pathname.includes('/invite')
      
      if (!isPublicPath) {
        router.push('/login')
      }
    }
  }, [router, setUser])
  
  return null
}