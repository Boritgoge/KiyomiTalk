import { useRouter } from 'next/router'
import { write, read } from '/components/FirebaseDatabase'
const Room = ({ roomId }) => {
  const router = useRouter()
  const { roomId } = router.query
  read('chats', (data) => {
    console.log(data);
  })
  return <p>Room: {roomId}</p>
}

export async function getStaticProps({ params: { roomId } }) {
  return {
    props: { roomId },
  };
}

export default Room