import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useRecoilState } from 'recoil'
import { roomIdState, roomTitleState } from '../../recoil/atoms'
import RoomVSCode from '../../components/RoomVSCode'
import LeftNavBar from '../../components/layout/LeftNavBar'
import { read } from '../../components/common/FirebaseDatabase'

export default function Editor() {
  const router = useRouter()
  const { roomId } = router.query
  const [, setRoomId] = useRecoilState(roomIdState)
  const [, setRoomTitle] = useRecoilState(roomTitleState)
  
  useEffect(() => {
    if (roomId) {
      // roomId를 Recoil state에 설정
      setRoomId(roomId)
      
      // 방 제목 가져오기
      const unsubscribe = read(`rooms/${roomId}/title`, (title) => {
        if (title) {
          setRoomTitle(title)
        }
      })
      
      return () => unsubscribe()
    }
  }, [roomId, setRoomId, setRoomTitle])
  
  return (
    <>
      <LeftNavBar />
      <RoomVSCode />
    </>
  )
}