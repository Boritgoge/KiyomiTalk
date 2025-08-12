import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil'
import { userState } from '../../recoil/atoms'
import { read, updateByPath } from '../../components/common/FirebaseDatabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faPlus, faLock, faLockOpen, faUsers, faSpinner } from '@fortawesome/free-solid-svg-icons'
import styles from '../../styles/ChatList.module.scss'
import LeftNavBar from '../../components/layout/LeftNavBar'

export default function Editor() {
  const router = useRouter()
  const loginUser = useRecoilValue(userState)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  useEffect(() => {
    // 채팅방 목록 가져오기
    const unsubscribe = read('rooms', (data) => {
      if (data) {
        const roomList = Object.entries(data).map(([id, room]) => ({
          id,
          ...room
        }))
        setRooms(roomList)
      }
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [])
  
  const createRoom = async () => {
    if (creating) return
    setCreating(true)
    
    const roomId = Date.now().toString()
    const roomData = {
      key: roomId,
      title: `채팅방 ${new Date().toLocaleDateString('ko-KR')}`,
      createdAt: Date.now(),
      createdBy: loginUser?.uid || 'guest',
      locked: false,
      members: loginUser?.uid ? { [loginUser.uid]: true } : {},
      playground: {
        code: '// 코드를 입력하세요\n',
        language: 'javascript'
      }
    }
    
    try {
      await updateByPath(`rooms/${roomId}`, roomData)
      router.push(`/editor/${roomId}`)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('채팅방 생성 중 오류가 발생했습니다.')
      setCreating(false)
    }
  }
  
  const joinRoom = (roomId) => {
    router.push(`/editor/${roomId}`)
  }
  
  const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest'
  
  return (
    <>
      <LeftNavBar />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <FontAwesomeIcon icon={faComments} className={styles.icon} />
            채팅방 목록
          </h1>
          <button 
            className={styles.createBtn}
            onClick={createRoom}
            disabled={creating}
          >
            {creating ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                생성 중...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faPlus} />
                새 채팅방
              </>
            )}
          </button>
        </div>
        
        {loading ? (
          <div className={styles.loading}>
            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinner} />
            <p>채팅방 목록을 불러오는 중...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className={styles.empty}>
            <FontAwesomeIcon icon={faComments} className={styles.emptyIcon} />
            <p>아직 생성된 채팅방이 없습니다.</p>
            <p className={styles.hint}>{`"새 채팅방" 버튼을 눌러 첫 번째 채팅방을 만들어보세요!`}</p>
          </div>
        ) : (
          <div className={styles.roomGrid}>
            {rooms.map(room => (
              <div 
                key={room.id} 
                className={styles.roomCard}
                onClick={() => joinRoom(room.id)}
              >
                <div className={styles.roomHeader}>
                  <h3>{room.title || '제목 없음'}</h3>
                  <div className={styles.roomStatus}>
                    {room.locked ? (
                      <FontAwesomeIcon icon={faLock} className={styles.locked} title="비공개" />
                    ) : (
                      <FontAwesomeIcon icon={faLockOpen} className={styles.open} title="공개" />
                    )}
                  </div>
                </div>
                <div className={styles.roomInfo}>
                  <span className={styles.date}>
                    생성일: {new Date(room.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                  {room.members && (
                    <span className={styles.members}>
                      <FontAwesomeIcon icon={faUsers} />
                      {Object.keys(room.members).length}
                    </span>
                  )}
                </div>
                {room.playground && (
                  <div className={styles.language}>
                    언어: {room.playground.language || 'javascript'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {isGuest && (
          <div className={styles.guestNotice}>
            <p>💡 게스트로 채팅방을 이용 중입니다. 로그인하면 더 많은 기능을 사용할 수 있습니다.</p>
          </div>
        )}
      </div>
    </>
  )
}