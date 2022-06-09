// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { read, updateByPath } from '/components/common/FirebaseDatabase'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { getItem } from '/components/common/LocalStorage'

export const getServerSideProps = async (context) => {
  const { query } = context;
  const { code } = query;
  return {
      props: {
          code,
      },
  };
};

export default function Invite() {
  const user = getItem ('cachedUser') || {} 
  const router = useRouter()
  const { code } = router.query
  useEffect(() => {
    if(user.uid) {
      const unsubscribe = read(`rooms/${code}/members`, (data) => {
        if(!data) return;
        data[user.uid] = { count: 0 };
        updateByPath(`rooms/${code}/members`, data)
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
