import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { FirebaseDatabase } from '../../../shared/lib/firebase/FirebaseDatabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faJs, faJava, faPython } from '@fortawesome/free-brands-svg-icons'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import styles from './EditorPage.module.scss'
import { useRecoilValue } from 'recoil'
import { userState } from '../../../entities/user/model'
import { Header } from '../../../widgets/header'

const MonacoEditorWithNoSSR = dynamic( 
  async () => import('@monaco-editor/react'),
  { ssr: false }
)

export default function EditorPage() {
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const loginUser = useRecoilValue(userState)
  const router = useRouter()
  const { roomId } = router.query
  const monacoRef = useRef(null)
  
  useEffect(() => {
    if (!roomId) return
    
    const unsubscribe = FirebaseDatabase.read(`rooms/${roomId}`, (data) => {
      const { key, locked, members, playground } = data || {}
      if(roomId !== key) return
      if(locked && !members[loginUser?.uid]) return
      const { code, language } = playground || {}
      setCode(code)
      setLanguage(language)
    })
    
    return () => {
      unsubscribe()
    }
  }, [roomId, loginUser])

  const setEditorLanguage = (language) => {
    setLanguage(language)
    FirebaseDatabase.updateByPath(`rooms/${roomId}/playground/language`, language)
  }
  
  return (
    <>
      <Header />
      <div className={styles.container}>
        <header className={styles.language_group}>
          <FontAwesomeIcon 
            className={language === 'javascript' ? styles.selected : ''} 
            icon={faJs} 
            onClick={() => setEditorLanguage('javascript')}
          />
          <FontAwesomeIcon 
            className={language === 'java' ? styles.selected : ''} 
            icon={faJava} 
            onClick={() => setEditorLanguage('java')}
          />
          <FontAwesomeIcon 
            className={language === 'python' ? styles.selected : ''} 
            icon={faPython} 
            onClick={() => setEditorLanguage('python')}
          />
          <FontAwesomeIcon 
            className={language === 'sql' ? styles.selected : ''} 
            icon={faDatabase} 
            onClick={() => setEditorLanguage('sql')}
          />
        </header>
        <MonacoEditorWithNoSSR
          theme="vs-dark"
          height="calc(100vh - 60px)"
          value={code}
          language={language}
          onChange={(newValue, { changes }) => {
            const [{ rangeLength, rangeOffset, text }] = changes
            if(rangeOffset === 0 && rangeLength === text.length) {
              return
            }
            FirebaseDatabase.updateByPath(`rooms/${roomId}/playground/code`, newValue)
          }}
          onMount={(editor) => {
            monacoRef.current = editor
          }}
        />
      </div>
    </>
  )
}