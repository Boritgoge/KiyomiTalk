import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import db, { write, read } from '/components/common/FirebaseDatabase'
import { getItem } from '/components/common/LocalStorage'
import Link from 'next/link'
const Rooms = () => {
  const router = useRouter()
  const [rooms, setRooms] = useState([])
  const [title, setTitle] = useState('')
  
  useEffect(() => {
    const user = getItem('cachedUser')
    if(!user) {
      router.push('/login')
    }
  }, [])

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