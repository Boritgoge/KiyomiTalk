import { useState, useEffect, useRef } from 'react';
import db, { write, read, toListWithKey } from '/components/common/FirebaseDatabase'
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import { useRecoilState, useRecoilValue } from 'recoil';
import styles from '../styles/RoomList.module.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faLock } from "@fortawesome/free-solid-svg-icons"

const RoomList = () => {
  const [rooms, setRooms] = useState([])
  const [inputToggle, setInputToggle] = useState(false)
  const inputRef = useRef(null)
  const [roomId, setRoomId] = useRecoilState(roomIdState)
  const [roomTitle, setRoomTitle] = useRecoilState(roomTitleState)
  const loginUser = useRecoilValue(userState)

  useEffect(() => {
    read('rooms', (data) => {
      setRooms(toListWithKey(data))
    })
  }, [db])

  useEffect(() => {
      inputToggle && inputRef.current.focus()
  }, [inputToggle])

  return (<>
    <header className={styles.header}>방목록</header>
    <ul className={styles.rooms}>
        {
          rooms && rooms.map( ({key, title, locked}) => 
          <li 
            key={key}
            onClick={() => {
              setRoomId(key)
              setRoomTitle(title)
            }}
          >
            <div className={styles.cols}>
              <a>{ title }</a>
              {locked && <FontAwesomeIcon icon={faLock}/>}
            </div>
          </li>
          )
        }
        {
          inputToggle && 
            <input 
              type="text"
              className={styles.input}
              onKeyPress={ ({key}) => {
                if(key === 'Enter') {
                  if(inputRef.current.value) {
                    write('rooms', { 
                      title: inputRef.current.value,
                      locked: false,
                      allowlist: {
                        [loginUser.uid]: true
                      },
                      creator: loginUser.uid,
                      created: new Date(),
                    })
                      inputRef.current.value = ''
                  }
                  setInputToggle(false)
                }
              }}
              onBlur={()=> {
                setInputToggle(false)
              }}
              ref={inputRef}
            />
        }
    </ul>
    <div className={styles.btnGroup}>
      <button 
        className={styles.btnAdd}
        href="#none"
        onClick={ () => { 
          setInputToggle(true)
        } }
      >
        <FontAwesomeIcon icon={faPlus} size="1x" color="#3F975A"/>
      </button>
    </div>
  </>)
}

export default RoomList