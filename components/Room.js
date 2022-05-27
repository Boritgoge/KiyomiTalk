import { useState, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import db, { write, read, toList } from '/components/common/FirebaseDatabase'
import styles from '../styles/Room.module.scss'
import moment from 'moment'
import Image from 'next/image'

const Room = () => {
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const roomId = useRecoilValue(roomIdState)
  const roomTitle = useRecoilValue(roomTitleState)
  const loginUser = useRecoilValue(userState)
  const refUl = useRef()

  useEffect(() => {
    const unsubscribe = read(`rooms/${roomId}`, ({ key, chats }) => {
      if(roomId !== key) return;
      setChats(toList(chats))
    })
    return () => {
      unsubscribe()
    }
  }, [db, roomId])

  useEffect(() => {
    refUl.current.scrollTop = refUl.current.scrollHeight
  })

  const sendMessage = () => {
    write(`rooms/${roomId}/chats`, { 
      message, 
      thumbnail: loginUser.photoURL,
      nickname: loginUser.displayName, 
      regdate: new Date(), 
    })
    setMessage("")
  }
  return <>
    <header className={styles.header}>{roomTitle}</header>
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