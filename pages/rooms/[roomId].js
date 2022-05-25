import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';
import db, { write, read } from '/components/FirebaseDatabase'
import styles from '../../styles/Home.module.css'

const Room = () => {
  const router = useRouter()
  const { roomId } = router.query
  const [chats, setChats] = useState([])
  const [chat, setChat] = useState('')
  useEffect(() => {
    const unsubscribe = read(`rooms/${roomId}/chats`, (data) => {
      setChats(() => [...Object.keys(data || {}).map(chatId => data[chatId])])
    })

    return () => {
        unsubscribe()
    }
  }, db)

  const createChat = () => {
    write(`rooms/${roomId}/chats`, { chat })
    setChat("")
  }
  const handleInput = (e) => {
    setChat(e.target.value)
  }
  const handleKeyPress = e => {
    if(e.key === 'Enter') {
      createChat()
    }
  }
  return <>
    <p className={styles.title}>Room: {roomId}</p>
    <ul className={styles.chatlist}>
      {
        chats.map(({chat}) => <li>{ chat }</li>)
      }
    </ul>
    <input type="text" onInput={handleInput} value={chat} onKeyPress={handleKeyPress}/>
    <button onClick={createChat}>보내기</button>
  </>
}

export default Room