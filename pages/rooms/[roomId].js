import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';
import db, { write, read } from '/components/FirebaseDatabase'
const Room = () => {
  const router = useRouter()
  const { roomId } = router.query
  const [chats, setChats] = useState([])
  const [chat, setChat] = useState('')
  useEffect(() => {
    read(`rooms/${roomId}/chats`, (data) => {
      setChats(() => [...Object.keys(data || {}).map(chatId => data[chatId])])
    })
  }, [db])

  const createChat = () => {
    write(`rooms/${roomId}/chats`, { chat })
    setChat("")
  }
  const handleInput = (e) => {
    setChat(e.target.value)
  }
  const handleKeyPress = e => {
    if(e.key === 'Enter') {
      createChat()
    }
  }
  return <>
    <p>Room: {roomId}</p>
    <ul>
      {
        chats && chats.map(({chat}, index) => <li key={index}>{ chat }</li>)
      }
    </ul>
    <input type="text" onInput={handleInput} value={chat} onKeyPress={handleKeyPress}/>
    <button onClick={createChat}>보내기</button>
  </>
}

export default Room