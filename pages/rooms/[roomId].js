import { useRouter } from 'next/router'
// import { write, read } from '/components/FirebaseDatabase'
const Room = () => {
  const router = useRouter()
  const { roomId } = router.query;
  
  // read('chats', (data) => {
  //   console.log(data);
  // })
  return <p>Room: {roomId}</p>
}

export default Room