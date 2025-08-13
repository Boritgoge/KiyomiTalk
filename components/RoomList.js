import { useState, useEffect, useRef } from 'react';
import db, { write, read, toListWithKey, updateByPath, removeByPath } from '/components/common/FirebaseDatabase'
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import { useRecoilState, useRecoilValue } from 'recoil';
import styles from '../styles/RoomList.module.scss'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faLock, faSync } from "@fortawesome/free-solid-svg-icons"
import { customAlert } from '../components/common/Modal'

const RoomList = () => {
  const [rooms, setRooms] = useState([])
  const [inputToggle, setInputToggle] = useState(false)
  const inputRef = useRef(null)
  const [roomId, setRoomId] = useRecoilState(roomIdState)
  const [roomTitle, setRoomTitle] = useRecoilState(roomTitleState)
  const loginUser = useRecoilValue(userState)

  const loadRooms = () => {
    read('rooms', async (data) => {
      const roomList = toListWithKey(data)
      
      // 제목이 없거나 이상한 방 자동 삭제
      for (const room of roomList) {
        if (!room.title || room.title.trim() === '' || !room.creator) {
          console.log(`삭제할 방: ${room.key}`)
          await removeByPath(`rooms/${room.key}`)
        }
      }
      
      // 정상적인 방만 필터링
      const validRooms = roomList.filter(room => 
        room.title && room.title.trim() !== '' && room.creator
      )
      setRooms(validRooms)
    })
  }

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
      inputToggle && inputRef.current.focus()
  }, [inputToggle])

  return (<>
    <header className={styles.header}>
      <span>방목록</span>
      <FontAwesomeIcon 
        icon={faSync} 
        className={styles.refreshBtn}
        onClick={() => {
          loadRooms()
        }}
      />
    </header>
    <ul className={styles.rooms}>
        {
          rooms && rooms.map( ({key, title, locked, members, creator}) => 
          <li
            className={
              key === roomId ? styles.selected : undefined
            }
            key={key}
            onClick={() => {
              // 게스트 체크 (cached user만 있고 실제 로그인 안한 경우)
              const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest'
              
              if(locked) {
                // 비공개방인 경우
                if(isGuest) {
                  // 게스트도 roomId는 설정하여 안내 화면 표시
                  setRoomId(key)
                  setRoomTitle(title)
                  return
                } else if(members && members[loginUser.uid]) {
                  // 멤버인 경우에만 접근 가능
                  updateByPath(`rooms/${key}/members/${loginUser.uid}/count`, 0)
                  setRoomId(key)
                  setRoomTitle(title)
                } else {
                  // 로그인 사용자지만 참여자가 아닌 경우도 roomId 설정하여 안내 화면 표시
                  setRoomId(key)
                  setRoomTitle(title)
                  return
                }
              } else {
                // 공개방인 경우
                if(!isGuest && loginUser) {
                  // 로그인 사용자는 멤버로 등록
                  updateByPath(`rooms/${key}/members/${loginUser.uid}`, {
                    count: 0,
                    profile: {
                      nickname: loginUser.displayName,
                      photoURL: loginUser.photoURL,
                    }
                  })
                }
                // 게스트도 공개방은 접근 가능
                setRoomId(key)
                setRoomTitle(title)
              }
            }}
          >
            <div className={styles.cols}>
              <a>{ title }</a>
              {
                key !== roomId 
                && members
                && loginUser
                && loginUser.uid
                && members[loginUser.uid] 
                && members[loginUser.uid].count > 0 
                && <div className={styles.count}><span>{ members[loginUser.uid].count }</span></div>
              }
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
                    // 게스트는 방 생성 불가
                    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest'
                    if(isGuest) {
                      customAlert('방 생성은 로그인이 필요합니다.')
                      setInputToggle(false)
                      return
                    }
                    
                    write('rooms', { 
                      title: inputRef.current.value,
                      locked: false,
                      members: {
                        [loginUser.uid]: {
                          count: 0,
                          profile: {
                            nickname: loginUser.displayName,
                            photoURL: loginUser.photoURL,
                          }
                        }
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