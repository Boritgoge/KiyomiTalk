import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic'
import { useRecoilValue } from 'recoil'
import { roomIdState } from '../recoil/atoms'
import db, { read, updateByPath } from '/components/common/FirebaseDatabase'

const MonacoEditorWithNoSSR = dynamic( 
    async () => import('@monaco-editor/react'),
    { ssr: false }
  )

export default function Editor() {
  const roomId = useRecoilValue(roomIdState)
  const [playground, setPlayground] = useState('')


  useEffect(() => {
    const unsubscribe = read(`rooms/${roomId}`, ({ key, locked, creator, members, playground }) => {
      if(roomId !== key) return;
      setLocked(locked)
      setCreator(creator)
      setMembers(members)      
      if(locked && !members[loginUser.uid]) return;
      setPlayground(playground)
      
    })
    return () => {
      unsubscribe()
    }
  }, [db, roomId])
  return <>
    <MonacoEditorWithNoSSR
        theme="vs-dark"
        height="100vh"
        defaultValue={playground}
        defaultLanguage="javascript"
        onChange={(newValue) => {
            updateByPath(`rooms/${roomId}/playground`, newValue)
        }}
    />
  </>
}
