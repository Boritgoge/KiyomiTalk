import { useState, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import db, { write, read, toList } from '/components/common/FirebaseDatabase'
import { uploadImage } from '/components/common/FirebaseStore'
import { getDownloadURL } from "firebase/storage";
import styles from '../styles/Room.module.scss'
import moment from 'moment'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from "@fortawesome/free-solid-svg-icons"

const Room = () => {
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const roomId = useRecoilValue(roomIdState)
  const roomTitle = useRecoilValue(roomTitleState)
  const loginUser = useRecoilValue(userState)
  const refUl = useRef()
  const refFile = useRef()

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

  
  const upload = async ({target}) => {
    const file = target.files[0];
    const res = await uploadImage(file);
    const imagePath = await getDownloadURL(res.ref);
    write(`rooms/${roomId}/chats`, { 
      message: "", 
      imagePath,
      thumbnail: loginUser.photoURL,
      nickname: loginUser.displayName, 
      regdate: new Date(), 
    })
    target.value = '';
  }

  return <>
    <header className={styles.header}>{roomTitle}</header>
    <ul className={styles.messages} ref={refUl}>
      {
        chats && chats.map(({ nickname, message, imagePath, regdate, thumbnail }, index) => (          
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
                      <span>
                        {
                          imagePath
                            ? <img src={imagePath}/>
                            : message
                        }
                      </span>
                    </div>
                  </div>
                </li>
                
          )
        )
      }
    </ul>
    <div className={styles.message_send}>
        <input type="text" value={message}
          onInput={({ target }) => { setMessage(target.value) }} 
          onKeyPress={({ key }) => { key === 'Enter' && sendMessage() }}
          onPaste={({ clipboardData }) => {
            console.log(clipboardData)
          }}
        />
        <FontAwesomeIcon icon={faImage} className={styles.image_upload} onClick={()=> {
          refFile.current.click()
        }}/>
        <input 
          type="file" 
          style={{ display: 'none' }} 
          ref={refFile}
          onChange={upload}
        />
    </div>
  </>
}

export default Room