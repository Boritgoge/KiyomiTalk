// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { read, updateByPath } from '/components/common/FirebaseDatabase'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getItem } from '/components/common/LocalStorage'
export default function Invite() {
  const user = getItem ('cachedUser') || {} 
  const router = useRouter()
  const { code } = router.query
  useEffect(() => {
    if(user.uid) {
      const unsubscribe = read(`rooms/${code}/allowlist`, (data) => {
        if(!data) return;
        data[user.uid] = true;
        updateByPath(`rooms/${code}/allowlist`, data)
        router.push('/')
      })
      return () => {
        unsubscribe()
      }
    } else {
      router.push('/login')
    }
  }, [ code ])
  return <>진행중...</>
}
