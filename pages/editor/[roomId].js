import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { read, updateByPath, removeByPath } from '../../components/common/FirebaseDatabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faJs, faJava, faPython } from '@fortawesome/free-brands-svg-icons'
import { faDatabase, faPaperPlane, faCode, faComments, faUser } from '@fortawesome/free-solid-svg-icons'
import styles from '../../styles/Editor.module.scss'
import { useRecoilValue } from 'recoil'
import { userState } from '../../recoil/atoms'
import CollaborativeCursor from '../../components/CollaborativeCursor'
import LeftNavBar from '../../components/layout/LeftNavBar'

const MonacoEditorWithNoSSR = dynamic( 
  async () => import('@monaco-editor/react'),
  { ssr: false }
)

export default function Editor() {
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [cursors, setCursors] = useState({})
  const [userColors, setUserColors] = useState({})
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [showChat, setShowChat] = useState(true)
  const [showEditor, setShowEditor] = useState(true)
  const loginUser = useRecoilValue(userState)
  const router = useRouter()
  const { roomId } = router.query
  const monacoRef = useRef(null)
  const editorRef = useRef(null)
  const cursorUpdateTimer = useRef(null)
  const isRemoteUpdate = useRef(false)
  const debounceTimer = useRef(null)
  const isInitialLoad = useRef(true) // 초기 로드 플래그
  const chatEndRef = useRef(null)
  const messageInputRef = useRef(null)
  
  useEffect(() => {
    if (!roomId) return
    
    // 초기 데이터 로드
    const unsubscribe = read(`rooms/${roomId}`, (data) => {
      const { key, locked, members, playground } = data || {}
      if(roomId !== key) return
      if(locked && !members[loginUser?.uid]) return
      const { code: newCode, language } = playground || {}
      
      // 언어 업데이트
      setLanguage(language || 'javascript')
      
      // 초기 로드 시에만 전체 코드 업데이트
      if (isInitialLoad.current && newCode !== undefined) {
        setCode(newCode || '')
        isInitialLoad.current = false
      }
    })
    
    // 간단한 방식으로 변경 - 전체 코드만 동기화
    const codeUnsubscribe = read(`rooms/${roomId}/playground/code`, (newCode) => {
      if (newCode === undefined || newCode === null) return
      if (isRemoteUpdate.current) return
      if (!monacoRef.current) {
        setCode(newCode)
        return
      }
      
      const currentCode = monacoRef.current.getValue()
      if (currentCode === newCode) return // 같으면 무시
      
      console.log('Syncing code from Firebase')
      const currentPosition = monacoRef.current.getPosition()
      isRemoteUpdate.current = true
      
      monacoRef.current.setValue(newCode)
      
      setTimeout(() => {
        if (monacoRef.current && currentPosition) {
          monacoRef.current.setPosition(currentPosition)
        }
        isRemoteUpdate.current = false
      }, 0)
    })
    
    // 메시지 데이터 구독
    const messageUnsubscribe = read(`rooms/${roomId}/messages`, (data) => {
      console.log('Received message data from Firebase:', data)
      if (data) {
        const messageList = Object.entries(data)
          .map(([id, msg]) => ({ id, ...msg }))
          .sort((a, b) => a.timestamp - b.timestamp)
        console.log('Processed message list:', messageList)
        setMessages(messageList)
      } else {
        console.log('No messages in this room yet')
        setMessages([])
      }
    })
    
    // 커서 데이터 구독
    const cursorUnsubscribe = read(`rooms/${roomId}/cursors`, (data) => {
      console.log('Received cursor data:', data);
      if (data) {
        const otherCursors = Object.entries(data)
          .filter(([uid]) => uid !== loginUser?.uid)
          .reduce((acc, [uid, cursor]) => {
            acc[uid] = cursor;
            return acc;
          }, {});
        console.log('Other cursors:', otherCursors);
        setCursors(otherCursors);
        
        // 사용자별 고유 색상 할당
        const colors = {};
        const colorPalette = [1, 2, 3, 4, 5, 6, 7, 8];
        let colorIndex = 0;
        
        Object.keys(data).forEach((uid) => {
          if (!userColors[uid]) {
            colors[uid] = colorPalette[colorIndex % colorPalette.length];
            colorIndex++;
          }
        });
        
        if (Object.keys(colors).length > 0) {
          setUserColors(prev => ({ ...prev, ...colors }));
        }
      }
    })
    
    return () => {
      unsubscribe()
      codeUnsubscribe()
      cursorUnsubscribe()
      messageUnsubscribe()
      if (loginUser?.uid) {
        removeByPath(`rooms/${roomId}/cursors/${loginUser.uid}`)
      }
    }
  }, [roomId, loginUser, userColors])

  const setEditorLanguage = (language) => {
    setLanguage(language)
    updateByPath(`rooms/${roomId}/playground/language`, language)
  }
  
  // 커서 위치 업데이트 함수
  const updateCursorPosition = () => {
    if (!monacoRef.current || !loginUser || !roomId) {
      console.log('Cannot update cursor:', { 
        hasEditor: !!monacoRef.current, 
        hasUser: !!loginUser, 
        hasRoomId: !!roomId 
      });
      return
    }
    
    const position = monacoRef.current.getPosition()
    const selection = monacoRef.current.getSelection()
    
    // position이 null인 경우 처리
    if (!position || !selection) {
      console.log('Position or selection is null, skipping update');
      return
    }
    
    const cursorData = {
      position: {
        lineNumber: position.lineNumber,
        column: position.column
      },
      selection: {
        startLineNumber: selection.startLineNumber,
        startColumn: selection.startColumn,
        endLineNumber: selection.endLineNumber,
        endColumn: selection.endColumn
      },
      user: {
        uid: loginUser.uid,
        displayName: loginUser.displayName || '익명',
        photoURL: loginUser.photoURL || null
      },
      timestamp: Date.now()
    }
    
    console.log('Updating cursor position:', cursorData);
    updateByPath(`rooms/${roomId}/cursors/${loginUser.uid}`, cursorData)
  }
  
  // 커서 업데이트 디바운싱
  const handleCursorChange = () => {
    if (cursorUpdateTimer.current) {
      clearTimeout(cursorUpdateTimer.current)
    }
    cursorUpdateTimer.current = setTimeout(updateCursorPosition, 50) // 커서 업데이트도 더 빠르게
  }
  
  // 코드 변경 핸들러 - 사용하지 않음 (onDidChangeModelContent로 대체)
  const handleCodeChange = (newValue) => {
    // Monaco Editor의 onDidChangeModelContent 이벤트로 대체
  }
  
  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId) return
    
    const messageId = Date.now().toString()
    const messageData = {
      text: newMessage.trim(),
      userId: loginUser?.uid || 'guest',
      userName: loginUser?.displayName || '게스트',
      userPhoto: loginUser?.photoURL || null,
      timestamp: Date.now()
    }
    
    console.log('Sending message:', messageData)
    console.log('Message path:', `rooms/${roomId}/messages/${messageId}`)
    
    try {
      await updateByPath(`rooms/${roomId}/messages/${messageId}`, messageData)
      console.log('Message sent successfully')
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
  
  // 메시지 입력 엔터 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // 채팅 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  return (
    <>
      <LeftNavBar />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.toggleButtons}>
            <button 
              className={`${styles.toggleBtn} ${showChat ? styles.active : ''}`}
              onClick={() => setShowChat(!showChat)}
            >
              <FontAwesomeIcon icon={faComments} />
              채팅
            </button>
            <button 
              className={`${styles.toggleBtn} ${showEditor ? styles.active : ''}`}
              onClick={() => setShowEditor(!showEditor)}
            >
              <FontAwesomeIcon icon={faCode} />
              코드 에디터
            </button>
          </div>
          {showEditor && (
            <div className={styles.language_group}>
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
            </div>
          )}
        </header>
        
        <div className={styles.mainContent}>
          {/* 채팅 패널 */}
          {showChat && (
            <div className={styles.chatPanel}>
              <div className={styles.chatMessages}>
                {messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <FontAwesomeIcon icon={faComments} />
                    <p>아직 메시지가 없습니다.</p>
                    <p>첫 번째 메시지를 보내보세요!</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div 
                      key={msg.id} 
                      className={`${styles.message} ${msg.userId === loginUser?.uid ? styles.own : ''}`}
                    >
                      <div className={styles.messageHeader}>
                        {msg.userPhoto ? (
                          <img src={msg.userPhoto} alt={msg.userName} className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            <FontAwesomeIcon icon={faUser} />
                          </div>
                        )}
                        <span className={styles.userName}>{msg.userName}</span>
                        <span className={styles.timestamp}>
                          {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <div className={styles.messageContent}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className={styles.chatInput}>
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className={styles.messageInput}
                />
                <button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={styles.sendBtn}
                >
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
            </div>
          )}
          
          {/* 코드 에디터 패널 */}
          {showEditor && (
            <div className={styles.editorPanel}>
              <MonacoEditorWithNoSSR
                theme="vs-dark"
                height="100%"
                value={code}
                language={language}
                onChange={handleCodeChange}
                onMount={(editor, monaco) => {
                  monacoRef.current = editor
                  editorRef.current = editor
                  
                  // 커서 변경 이벤트 리스너
                  editor.onDidChangeCursorPosition(handleCursorChange)
                  editor.onDidChangeCursorSelection(handleCursorChange)
                  
                  // 텍스트 변경 이벤트 리스너 (간단한 동기화)
                  editor.onDidChangeModelContent((event) => {
                    if (isRemoteUpdate.current) return
                    
                    console.log('Local change detected')
                    
                    // 디바운싱으로 Firebase 업데이트
                    if (debounceTimer.current) {
                      clearTimeout(debounceTimer.current)
                    }
                    
                    debounceTimer.current = setTimeout(() => {
                      const currentCode = editor.getValue()
                      console.log('Updating Firebase with:', currentCode.substring(0, 50) + '...')
                      updateByPath(`rooms/${roomId}/playground/code`, currentCode)
                    }, 300)
                  })
                  
                  // 에디터에 포커스만 주기 (초기 위치 설정 안 함)
                  setTimeout(() => {
                    editor.focus()
                  }, 100)
                }}
              />
              {/* 다른 사용자들의 커서 표시 */}
              {Object.entries(cursors).map(([uid, cursor]) => (
                <CollaborativeCursor
                  key={uid}
                  cursor={cursor}
                  editor={editorRef.current}
                  colorIndex={userColors[uid] || 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}