import { useState, useEffect } from 'react';
import db, { write, read, toListWithKey } from '/components/common/FirebaseDatabase'
import { roomIdState, roomTitleState } from '../recoil/atoms';
import { useRecoilState } from 'recoil';

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
    <p>방 목록</p>
    <ul>
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
    <p>방 생성</p>
    <input type="text" onInput={ ({target}) => { setTitle(target.value) } }/>
    <button type="button" onClick={ () => { write('rooms', { title }) } }>방 만들기</button>
  </>)
}

export default RoomList