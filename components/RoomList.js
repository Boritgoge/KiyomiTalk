import { useState, useEffect } from 'react';
import db, { write, read, toListWithKey } from '/components/common/FirebaseDatabase'
import { roomIdState, roomTitleState } from '../recoil/atoms';
import { useRecoilState } from 'recoil';
import styles from '../styles/RoomList.module.scss'

const RoomList = () => {
  const [rooms, setRooms] = useState([])
  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useRecoilState(roomIdState)
  const [roomTitle, setRoomTitle] = useRecoilState(roomTitleState)

  useEffect(() => {
    read('rooms', (data) => {
      setRooms(toListWithKey(data))
    })
  }, [db])

  return (<>
    <header className={styles.header}>방목록</header>
    <ul className={styles.rooms}>
        {
          rooms && rooms.map( ({key, title}) => 
          <li 
            key={key}
            onClick={() => {
              setRoomId(key)
              setRoomTitle(title)
            }}
          >
              <a>{ title }</a>
            </li>
            )
          }
    </ul>
    <input type="text" onInput={ ({target}) => { setTitle(target.value) } }/>
    <button type="button" onClick={ () => { write('rooms', { title }) } }>방 만들기</button>
  </>)
}

export default RoomList