import { FirebaseDatabase } from '../../../shared/lib/firebase/FirebaseDatabase'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { LocalStorage } from '../../../shared/lib/storage/LocalStorage'

export default function InvitePage() {
  const user = LocalStorage.getItem('cachedUser') || {}
  const router = useRouter()
  const { code } = router.query
  
  useEffect(() => {
    if (!code) return
    
    if (user.uid) {
      const unsubscribe = FirebaseDatabase.read(`rooms/${code}/members`, (data) => {
        if (!data) return
        data[user.uid] = { count: 0 }
        FirebaseDatabase.updateByPath(`rooms/${code}/members`, data)
        router.push('/')
      })
      
      return () => {
        unsubscribe()
      }
    } else {
      router.push('/login')
    }
  }, [code, user.uid, router])
  
  return <>진행중...</>
}