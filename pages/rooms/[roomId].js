import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react';
import db, { write, read } from '/components/FirebaseDatabase'
import styles from '../../styles/Home.module.css'

const Room = () => {
  const router = useRouter()
  const { roomId } = router.query
  const [chats, setChats] = useState([])
  const [chat, setChat] = useState('')
  const refUl = useRef()
  useEffect(() => {
    read(`rooms/${roomId}/chats`, (data) => {
      setChats(() => [...Object.keys(data || {}).map(chatId => data[chatId])])
    })
  }, [db])

  useEffect(() => {
    refUl.current.scrollTop = refUl.current.scrollHeight
  })

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
    <ul className={styles.chatlist} ref={refUl}>
      {
        chats && chats.map(({chat}, index) => <li key={index}>{ chat }</li>)
      }
    </ul>
    <div className={styles.leftalign}>
      <div className={styles.chat}>
        <input className={styles.chatinput} type="text" onInput={handleInput} value={chat} onKeyPress={handleKeyPress}/>
        <button className={styles.sendbtn} onClick={createChat}>보내기</button>
      </div>
    </div>
  </>
}

export default Room