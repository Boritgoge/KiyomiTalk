import styles from './RoomList.module.scss'
import { useRecoilState } from 'recoil'
import { roomIdState, userState } from '../../../shared/lib/recoil/atoms'
import { useEffect, useState } from 'react'
import { FirebaseAuth } from '../../../shared/lib/firebase/FirebaseAuth'
import { FirebaseDatabase } from '../../../shared/lib/firebase/FirebaseDatabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faLink } from '@fortawesome/free-solid-svg-icons'
import { LocalStorage } from '../../../shared/lib/storage/LocalStorage'

export default function RoomList() {
  const [roomId, setRoomId] = useRecoilState(roomIdState)
  const [user, setUser] = useRecoilState(userState)
  const [rooms, setRooms] = useState(null)
  const [createModal, setCreateModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  useEffect(() => {
    // Check for cached user first (including mock user)
    const cachedUser = LocalStorage.getItem('cachedUser')
    
    // Always try to listen to Firebase auth changes
    const unsubscribe = FirebaseAuth.onAuthStateChanged((firebaseUser) => {
      const currentUser = firebaseUser || cachedUser
      
      if (currentUser) {
        setUser(currentUser)
        
        // Always use Firebase for rooms
        const unsubscribeRooms = FirebaseDatabase.listenUserRooms(currentUser.uid, (rooms) => {
          setRooms(rooms || {})
        })
        
        return () => {
          if (unsubscribeRooms) unsubscribeRooms()
        }
      } else {
        setRooms(null)
      }
    })
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [setUser])

  const onCreateRoom = async () => {
    if (!roomName) return
    const newRoomId = await FirebaseDatabase.createRoom(roomName, user)
    setRoomId(newRoomId)
    setRoomName('')
    setCreateModal(false)
  }

  const onJoinRoom = async () => {
    if (!inviteCode) return
    const roomId = await FirebaseDatabase.joinRoomByInvite(inviteCode, user)
    if (roomId) {
      setRoomId(roomId)
      setInviteCode('')
      setInviteModal(false)
    } else {
      alert('초대 코드가 유효하지 않습니다.')
    }
  }

  const onRoomClick = (roomId) => {
    setRoomId(roomId)
  }

  if (!user) {
    return <div className={styles.roomList}>
      <div className={styles.loginPrompt}>로그인이 필요합니다.</div>
    </div>
  }

  return <div className={styles.roomList}>
    <div className={styles.header}>
      <div className={styles.title}>채팅방</div>
      <div className={styles.actions}>
        <FontAwesomeIcon icon={faPlus} className={styles.icon} onClick={() => setCreateModal(true)}/>
        <FontAwesomeIcon icon={faLink} className={styles.icon} onClick={() => setInviteModal(true)}/>
      </div>
    </div>
    
    <div className={styles.rooms}>
      {rooms && Object.keys(rooms).map(id => (
        <div 
          key={id} 
          className={`${styles.room} ${roomId === id ? styles.active : ''}`}
          onClick={() => onRoomClick(id)}
        >
          {rooms[id].name}
        </div>
      ))}
    </div>

    {createModal && (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h3>새 채팅방 만들기</h3>
          <input 
            type="text" 
            placeholder="채팅방 이름" 
            value={roomName}
            onChange={e => setRoomName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && onCreateRoom()}
          />
          <div className={styles.modalActions}>
            <button onClick={onCreateRoom}>만들기</button>
            <button onClick={() => setCreateModal(false)}>취소</button>
          </div>
        </div>
      </div>
    )}

    {inviteModal && (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h3>초대 코드로 참여</h3>
          <input 
            type="text" 
            placeholder="초대 코드" 
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && onJoinRoom()}
          />
          <div className={styles.modalActions}>
            <button onClick={onJoinRoom}>참여</button>
            <button onClick={() => setInviteModal(false)}>취소</button>
          </div>
        </div>
      </div>
    )}
  </div>
}