import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react';
import db, { write, read, readOnce } from '/components/FirebaseDatabase'
import { getItem } from '/components/LocalStorage'
import styles from './Room.module.scss'
import moment from 'moment'

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
      if(data) {
        setTitle(data.title)
      }
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
    write(`rooms/${roomId}/chats`, { message, nickname, regdate: new Date() })
    setMessage("")
  }
  return <>
    <p>{title}</p>
    <ul className={styles.messages} ref={refUl}>
      {
        chats && chats.map(({ nickname, message, regdate }, index) => (
            <li 
              className={styles.message}
              key={index}
            >
              <div className={styles.thumbnail}>
                <span></span>
              </div>
              <div>
                <div className={styles.header}>
                  <span className={styles.nickname}>{nickname}</span>
                  <span className={styles.regdate}>{moment(regdate).format('YYYY-MM-DD HH:mm:ss')}</span>
                </div>
                <div>
                  <span>{message}</span>
                </div>
              </div>
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