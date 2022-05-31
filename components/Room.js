import { useState, useEffect, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import db, { write, read, updateByPath, toList } from '/components/common/FirebaseDatabase'
import { uploadFile } from '/components/common/FirebaseStore'
import { getDownloadURL } from "firebase/storage";
import styles from '../styles/Room.module.scss'
import moment from 'moment'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faLock, faLockOpen, faShareFromSquare } from "@fortawesome/free-solid-svg-icons"

const Room = () => {
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const [allowlist, setAllowlist] = useState([])
  const [locked, setLocked] = useState(false)
  const roomId = useRecoilValue(roomIdState)
  const roomTitle = useRecoilValue(roomTitleState)
  const loginUser = useRecoilValue(userState)

  const refUl = useRef()
  const refFile = useRef()

  useEffect(() => {
    const unsubscribe = read(`rooms/${roomId}`, ({ key, locked, allowlist, chats }) => {
      if(roomId !== key) return;
      setLocked(locked)
      setAllowlist(allowlist)
      if(locked && !allowlist[loginUser.uid]) return;
      setChats(toList(chats))
    })
    return () => {
      unsubscribe()
    }
  }, [db, roomId])

  useEffect(() => {
    if(locked) return;
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

  const sendImage = async (file) => {
    if(!file || file.type !== 'image/jpeg') return;
    const res = await uploadFile(file);
    const imagePath = await getDownloadURL(res.ref);
    write(`rooms/${roomId}/chats`, { 
      message: "", 
      imagePath,
      thumbnail: loginUser.photoURL,
      nickname: loginUser.displayName, 
      regdate: new Date(), 
    })
    refFile.current.value = '';
  }
  const toggleLock = async () => {
    updateByPath(`rooms/${roomId}/locked`, !locked)
  }
  return <>
    { locked && !allowlist[loginUser.uid]
      ? <div>
        <span>Locked!</span>
        <span>Locked!</span>
        <span>Locked!</span>
        <span>Locked!</span>
        <span>Locked!</span>
        <span>Locked!</span>
        <span>Locked!</span>
        <span>Locked!</span>
      </div>
      : [
        <header className={styles.header}>
          <span>{roomTitle}</span>
          <div className={styles.btnGroup}>
            {
            locked 
              ? <FontAwesomeIcon icon={faLock} onClick={toggleLock}/>
              : <FontAwesomeIcon icon={faLockOpen} onClick={toggleLock}/>
            }
            <FontAwesomeIcon icon={faShareFromSquare}/>
          </div>

        </header>
        ,
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
        ,
        <div className={styles.message_send}>
            <input type="text" value={message}
              onInput={({ target }) => { setMessage(target.value) }} 
              onKeyPress={({ key }) => { key === 'Enter' && sendMessage() }}
              onPaste={({ clipboardData }) => {
                if(clipboardData.items.length > 0) {
                  const [ item ] = clipboardData.items;
                  const file = item.getAsFile();
                  sendImage(file);
                }
              }}
            />
            <FontAwesomeIcon 
              icon={faImage} 
              className={styles.image_upload} 
              onClick={()=> {
                refFile.current.click();
              }}
            />
            <input 
              type="file" 
              style={{ display: 'none' }} 
              ref={refFile}
              accept="image/jpeg"
              onChange={({target}) => {
                sendImage(target.files[0]);
              }}
            />
        </div>
      ]
    }
  </>
}

export default Room