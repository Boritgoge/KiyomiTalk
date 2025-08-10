import styles from './Room.module.scss'
import { useRecoilState } from 'recoil'
import { roomIdState, userState } from '../../../shared/lib/recoil/atoms'
import { useEffect, useState } from 'react'
import { FirebaseAuth } from '../../../shared/lib/firebase/FirebaseAuth'
import { FirebaseDatabase } from '../../../shared/lib/firebase/FirebaseDatabase'
import { FirebaseStore } from '../../../shared/lib/firebase/FirebaseStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons'
import { LocalStorage } from '../../../shared/lib/storage/LocalStorage'
import { useRouter } from 'next/router'

export default function Room() {
  const router = useRouter()
  const [roomId, setRoomId] = useRecoilState(roomIdState)
  const [user, setUser] = useRecoilState(userState)
  const [room, setRoom] = useState(null)
  const [roomMembers, setRoomMembers] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (!roomId) return
    
    // Always use Firebase
    const unsubscribeRoom = FirebaseDatabase.listenRoom(roomId, (room) => {
      setRoom(room)
    })
    
    const unsubscribeMembers = FirebaseDatabase.listenRoomMembers(roomId, (members) => {
      setRoomMembers(members)
    })
    
    // Set user from cache if not logged in
    const cachedUser = LocalStorage.getItem('cachedUser')
    if (cachedUser && !user) {
      setUser(cachedUser)
    }
    
    return () => {
      if (unsubscribeRoom) unsubscribeRoom()
      if (unsubscribeMembers) unsubscribeMembers()
    }
  }, [roomId, user, setUser])

  const sendMessage = async () => {
    if (!textInput) return
    
    // Get user from state or cache
    const currentUser = user || LocalStorage.getItem('cachedUser')
    if (!currentUser) {
      console.error('No user found')
      return
    }
    
    // Always use Firebase
    await FirebaseStore.sendMessage(roomId, currentUser, textInput)
    setTextInput('')
  }

  const onEditorClick = () => {
    router.push(`/editor/${roomId}`)
  }

  const onDeleteRoom = async () => {
    if (!window.confirm('정말로 방을 삭제하시겠습니까?')) return
    await FirebaseDatabase.deleteRoom(roomId)
    setRoomId(null)
  }

  const onExitRoom = async () => {
    if (!window.confirm('정말로 방을 나가시겠습니까?')) return
    await FirebaseDatabase.exitRoom(roomId, user.uid)
    setRoomId(null)
  }

  if (!room) return null

  return <div className={styles.room}>
    <div className={styles.header}>
      <div className={styles.title}>{room.name}</div>
      <div className={styles.actions}>
        <FontAwesomeIcon icon={faEdit} className={styles.icon} onClick={onEditorClick}/>
        {room.owner === user?.uid && <FontAwesomeIcon icon={faTrash} className={styles.icon} onClick={onDeleteRoom}/>}
        <FontAwesomeIcon icon={faTimes} className={styles.icon} onClick={onExitRoom}/>
      </div>
    </div>
    <div className={styles.members}>
      {roomMembers && Object.keys(roomMembers).map(uid => (
        <div key={uid} className={styles.member}>
          {roomMembers[uid].displayName}
        </div>
      ))}
    </div>
    <div className={styles.messages}>
      {room.messages && Object.keys(room.messages).map(messageId => {
        const message = room.messages[messageId]
        return <div key={messageId} className={styles.message}>
          <div className={styles.author}>{message.displayName}</div>
          <div className={styles.content}>{message.text}</div>
        </div>
      })}
    </div>
    <div className={styles.input}>
      <input 
        type="text" 
        value={textInput} 
        onChange={e => setTextInput(e.target.value)}
        onKeyPress={e => e.key === 'Enter' && sendMessage()}
        placeholder="메시지를 입력하세요..."
      />
    </div>
  </div>
}