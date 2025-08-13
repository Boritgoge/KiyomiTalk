import RoomVSCode from './RoomVSCode';

const Room = () => {
  return <RoomVSCode />;
};

export default Room;

// Original Room component code below (now replaced with RoomVSCode)
/*
import { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import db, { write, read, updateByPath, toList, removeByPath } from '/components/common/FirebaseDatabase'
import { customAlert, customConfirm } from './common/Modal'
import { uploadFile } from '/components/common/FirebaseStore'
import { getDownloadURL } from "firebase/storage";
import styles from '../styles/Room.module.scss'
import moment from 'moment'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faLock, faLockOpen, faShareFromSquare, faUserGroup, faLaptopCode, faTrash, faTimes } from "@fortawesome/free-solid-svg-icons"
import { copyToClipboard } from './common/CommonUtil';
import { Popover } from '@headlessui/react'


const RoomOriginal = () => {
  const [chats, setChats] = useState([])
  const [message, setMessage] = useState('')
  const [creator, setCreator] = useState('')
  const [members, setMembers] = useState({})
  const [locked, setLocked] = useState(false)
  const [roomId, setRoomId] = useRecoilState(roomIdState)
  const [roomTitle, setRoomTitle] = useRecoilState(roomTitleState)
  const loginUser = useRecoilValue(userState)

  const refUl = useRef()
  const refFile = useRef()

  useEffect(() => {
    const unsubscribe = read(`rooms/${roomId}`, (data) => {
      const { key, locked, creator, members, chats } = data || {};
      if(roomId !== key) {
        setChats([])
        return;
      }
      setLocked(locked)
      setCreator(creator)
      setMembers(members || {})
      if(locked && (!members || !members[loginUser.uid])) return;
      updateByPath(`rooms/${key}/members/${loginUser.uid}/count`, 0)
      setChats(toList(chats))
    })
    return () => {
      unsubscribe()
    }
  }, [db, roomId])

  useEffect(() => {
    if(locked && (!members || !members[loginUser.uid])) return;
    if(refUl.current) {
      refUl.current.scrollTop = refUl.current.scrollHeight
    }
  })

  const sendMessage = () => {
    // 게스트는 메시지 전송 불가
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest'
    if(isGuest) {
      customAlert('메시지 전송은 로그인이 필요합니다.')
      return
    }
    
    write(`rooms/${roomId}/chats`, { 
      message,
      thumbnail: loginUser.photoURL,
      nickname: loginUser.displayName, 
      regdate: new Date(), 
    })
    
    const reqMembers = {};
    for(const uid in members) {
      reqMembers[uid] = {
        ...members[uid],
        count: uid === loginUser.uid ? members[uid].count : members[uid].count + 1
      }
    }
    updateByPath(`rooms/${roomId}/members`, reqMembers);
    setMessage("")
  }

  const sendImage = async (file) => {
    if(!file || file.type !== 'image/jpeg') return;
    
    // 게스트는 이미지 전송 불가
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest'
    if(isGuest) {
      customAlert('이미지 전송은 로그인이 필요합니다.')
      return
    }
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
  
  const deleteRoom = async () => {
    const confirmed = await customConfirm(`"${roomTitle}" 방을 삭제하시겠습니까?\n모든 채팅 내용이 삭제됩니다.`, {
      title: '방 삭제',
      confirmText: '삭제',
      cancelText: '취소'
    });
    
    if(confirmed) {
      await removeByPath(`rooms/${roomId}`);
      setRoomId(null);
      setRoomTitle(null);
      customAlert('방이 삭제되었습니다.');
    }
  }
  
  const kickMember = async (uid, nickname) => {
    const confirmed = await customConfirm(`${nickname}님을 강퇴하시겠습니까?`, {
      title: '멤버 강퇴',
      confirmText: '강퇴',
      cancelText: '취소'
    });
    
    if(confirmed) {
      await removeByPath(`rooms/${roomId}/members/${uid}`);
      customAlert(`${nickname}님이 강퇴되었습니다.`);
    }
  }
  const isAllowed = () => {
    // 게스트는 비공개방 접근 불가
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest'
    if(isGuest) return false
    
    return creator === loginUser?.uid || (members && members[loginUser?.uid])
  }
  return <>
    { 
      locked && !isAllowed()
        ?
        <div className={styles.lockScreen}>
          <FontAwesomeIcon icon={faLock} />
          <h2>비공개 채팅방</h2>
          <p>이 채팅방은 참여자만 접근할 수 있습니다.</p>
          {
            (!loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest')
            ? <p className={styles.guestInfo}>게스트는 비공개방에 접근할 수 없습니다.<br/>로그인 후 이용해 주세요.</p>
            : <p className={styles.memberInfo}>방장이 초대해야 참여할 수 있습니다.</p>
          }
        </div>
        : 
        <>
          <header className={styles.header}>
            <span>{roomTitle}</span>
            <div className={styles.btnGroup}>
              <FontAwesomeIcon
                icon={faLaptopCode}
                title="코드 에디터"
                onClick={()=>{
                  window.open(`/editor/${roomId}`, '_blank')
                }}                 
              />
              <Popover className={styles.member_popup} >
                <Popover.Button className={styles.member_popup_button}>
                  <FontAwesomeIcon 
                    icon={faUserGroup}
                    title="멤버 목록" />
                </Popover.Button>
                <Popover.Panel className={styles.member_popup_panel}>
                  <div className={styles.member_popup_header}>
                    <span>참여자 목록</span>
                  </div>
                  <ul className={styles.member_list}>
                    {
                      members && Object.keys(members).length > 0 
                      ? Object.keys(members)
                      .map(uid => ({uid, ...members[uid]}))
                      .map(({ uid, profile }) => {
                        const { nickname, photoURL } = profile || {};
                        const isCreator = uid === creator;
                        const isMe = uid === loginUser?.uid;
                        const isGuest = uid.startsWith('guest_');
                        
                        // 게스트 유저 표시 처리
                        const displayName = nickname || (isGuest ? `게스트${uid.split('_')[1]?.substring(0, 4)}` : 'Unknown');
                        const guestAvatar = "data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='30' height='30' fill='%23cccccc' rx='15'/%3E%3Ctext x='15' y='20' text-anchor='middle' fill='%23666' font-size='14' font-family='Arial'%3EG%3C/text%3E%3C/svg%3E";
                        const displayPhoto = photoURL || (isGuest ? guestAvatar : null);
                        
                        return ( 
                          <li key={uid} className={styles.member_item}>
                            <div className={styles.member_info}>
                              {
                              displayPhoto && (
                                displayPhoto.includes('data:') || displayPhoto.includes('placeholder')
                                ? <img
                                    src={displayPhoto}
                                    alt="Profile"
                                    width={30}
                                    height={30}
                                    style={{borderRadius: '50%'}}
                                  />
                                : <Image
                                    src={displayPhoto}
                                    alt="Profile"
                                    width={30}
                                    height={30}
                                  />
                              )
                              }
                              <div className={styles.member_name}>
                                <span>{displayName}</span>
                                <div className={styles.badges}>
                                  {isCreator && <span className={styles.badge}>방장</span>}
                                  {isMe && !isCreator && <span className={styles.badge_me}>나</span>}
                                  {isGuest && <span className={styles.badge_guest}>게스트</span>}
                                </div>
                              </div>
                            </div>
                            {
                              creator === loginUser?.uid && !isCreator && !isMe &&
                              <FontAwesomeIcon 
                                icon={faTimes}
                                className={styles.kickBtn}
                                title="강퇴"
                                onClick={() => kickMember(uid, displayName)}
                              />
                            }
                          </li>
                        )
                      })
                      : <li className={styles.member_item}>
                          <div className={styles.member_info}>
                            <span style={{fontSize: '13px', color: '#8b8b8b'}}>참여자가 없습니다</span>
                          </div>
                        </li>
                    }
                  </ul>
                </Popover.Panel>
              </Popover>
              {
                creator === loginUser.uid && 
                <>
                  {
                  locked 
                    ? <FontAwesomeIcon 
                        icon={faLock} 
                        title="비공개방 전환"
                        onClick={toggleLock}/>
                    : <FontAwesomeIcon 
                        icon={faLockOpen} 
                        title="공개방 전환"
                        onClick={toggleLock}/>
                  }
                  <FontAwesomeIcon 
                    icon={faShareFromSquare}
                    title="초대 링크 복사" 
                    onClick={
                      ()=>{
                        copyToClipboard(`${window.location.origin}/invite/${roomId}`)
                        customAlert('초대 링크가 복사되었습니다.');
                      }
                    }/>
                  <FontAwesomeIcon 
                    icon={faTrash}
                    title="방 삭제"
                    className={styles.deleteBtn}
                    onClick={deleteRoom}
                  />
                </>
              }
            </div>
          </header>
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
                          <div className={styles.content}>
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
        </>
    }
  </>
}

export default Room;
*/