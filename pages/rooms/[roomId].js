import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react';
import db, { write, read, readOnce } from '/components/FirebaseDatabase'
import { getItem } from '/components/LocalStorage'
import styles from './Room.module.scss'
import moment from 'moment'
import Image from 'next/image'

const Room = () => {
  const router = useRouter()
  const { roomId } = router.query
  const [title, setTitle] = useState('')
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const refUl = useRef()
  useEffect(() => {
    readOnce(`rooms/${roomId}`, (data) => {
      if(data) {
        setTitle(data.title)
      }
    })
    const user = getItem('cachedUser')
    if(user) {
      setNickname(`${user.displayName}(${user.email})`)
      setThumbnail(user.photoURL)
    } else {
      router.push('/login')
    }
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
    write(`rooms/${roomId}/chats`, { message, nickname, regdate: new Date(), thumbnail })
    setMessage("")
  }
  return <>
    <p>{title}</p>
    <ul className={styles.messages} ref={refUl}>
      {
        chats && chats.map(({ nickname, message, regdate, thumbnail }, index) => (
            <li 
              className={styles.message}
              key={index}
            >
              <div className={styles.thumbnail}>
                <span>
                  {
                  thumbnail && <Image
                      src={thumbnail}
                      alt="Picture of the author"
                      width={50}
                      height={50}
                      // width={500} automatically provided
                      // height={500} automatically provided
                      // blurDataURL="data:..." automatically provided
                      // placeholder="blur" // Optional blur-up while loading
                    />
                  }
                </span>
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