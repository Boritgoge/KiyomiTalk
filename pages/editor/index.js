import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Editor() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to home if no roomId
    router.push('/')
  }, [router])
  
  return <div>Loading...</div>
}