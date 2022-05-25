import { useState, useEffect } from 'react';
import db, { write, read } from '/components/FirebaseDatabase'
import Link from 'next/link'
const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [title, setTitle] = useState('')
  useEffect(() => {
    read('rooms', (data) => {
        setRooms(() => [...Object.keys(data || {}).map(roomId => ({roomId, ...data[roomId]}) )])
    })
  }, [db])
  const handleTitle = function(e) {
    setTitle(e.target.value)
  }
  const createRoom = () => {
      write('rooms', { title })
  }
  return (<>
    <p>방 목록</p>
    <ul>
        {
            rooms && rooms.map( ({roomId, title}) => 
            <li key={roomId}>
                <Link href={`/rooms/${roomId}`}>
                    <a>{ title }</a>
                </Link>
            </li>
            )
        }
    </ul>
    <p>방 생성</p>
    <input type="text" onInput={handleTitle}/>
    <button type="button" onClick={createRoom}>방 만들기</button>
  </>)
}

export default Rooms