import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react';
import db, { write, read, readOnce } from '/components/FirebaseDatabase'
import { getItem } from '/components/LocalStorage'
import styles from './Room.module.css'

const Room = () => {
  const router = useRouter()
  const { roomId } = router.query
  const [title, setTitle] = useState('')
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const [nickname, setNickname] = useState(getItem('nickname'))
  const refUl = useRef()

  useEffect(() => {
    readOnce(`rooms/${roomId}`, (data) => {
      setTitle(data.title)
    })
  }, [])

  useEffect(() => {
    read(`rooms/${roomId}/chats`, (data) => {
      setChats(() => [...Object.keys(data || {}).map(chatId => data[chatId])])
    })
  }, [db])

  useEffect(() => {
    refUl.current.scrollTop = refUl.current.scrollHeight
  })

  const sendMessage = () => {
    write(`rooms/${roomId}/chats`, { message, nickname })
    setMessage("")
  }
  const test = {
    "display": "flex",
    "align-items": "flex-start",
    "font-size": "12px",
  };
  return <>
    <p>{title}</p>
    <ul className={styles.messages} ref={refUl}>
      {
        chats && chats.map(
          ({ nickname, message }, index) => (
            <li 
              key={index}
              style={test}
            >
              <strong
                style={
                  {
                    "margin-right": "1rem",
                  }
                }
              >
                {nickname}
              </strong>
              <span>
                {message}
              </span>
            </li>
          )
        )
      }
    </ul>
    <div>
        <input 
          type="text" 

          onInput={({ target }) => { 
            setMessage(target.value) 
          }} 

          onKeyPress={({ key }) => {
            if(key === 'Enter') {
              sendMessage()
            }
          }}

          value={message} 
        />
        <button 
          onClick={() => {
            sendMessage()
          }}
        >보내기</button>
    </div>
  </>
}

export default Room