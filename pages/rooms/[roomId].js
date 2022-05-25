import { useRouter } from 'next/router'
import { write, read } from '/components/FirebaseDatabase'
const Post = () => {
  const router = useRouter()
  const { roomId } = router.query
  read('chats', (data) => {
    console.log(data);
  })
  return <p>Post: {roomId}</p>
}

export default Post