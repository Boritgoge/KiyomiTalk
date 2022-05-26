import { useState, useEffect } from 'react';
import db, { write, read } from '/components/FirebaseDatabase'
import Link from 'next/link'
const Rooms = () => {
  const [rooms, setRooms] = useState([])
  const [title, setTitle] = useState('')

  const toRoomsArray = (data) => [...Object.keys(data || {}).map(roomId => ({roomId, ...data[roomId]}) )]
  useEffect(() => {
    read('rooms', (data) => {
      setRooms(toRoomsArray(data))
    })
  }, [db])

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
    <input type="text" onInput={ ({target}) => { setTitle(target.value) } }/>
    <button type="button" onClick={ () => { write('rooms', { title }) } }>방 만들기</button>
  </>)
}

export default Rooms