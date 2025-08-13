import { useState, useEffect, useRef } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import { roomIdState, roomTitleState, userState } from '../recoil/atoms';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import db, { write, read, updateByPath, toList, removeByPath } from '/components/common/FirebaseDatabase';
import { customAlert, customConfirm } from './common/Modal';
import { uploadFile } from '/components/common/FirebaseStore';
import { getDownloadURL } from "firebase/storage";
import styles from '../styles/RoomVSCode.module.scss';
import moment from 'moment';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, faLock, faLockOpen, faShareFromSquare, faUserGroup, 
  faLaptopCode, faTrash, faTimes, faFolder, faComments, faCode,
  faPaperPlane, faUser, faPlus, faChevronRight, faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import { copyToClipboard } from './common/CommonUtil';
import { Popover } from '@headlessui/react';
import FileExplorer from './FileExplorer';
import RoomList from './RoomList';

const MonacoEditorWithNoSSR = dynamic( 
  async () => import('@monaco-editor/react'),
  { ssr: false }
);

const RoomVSCode = () => {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [creator, setCreator] = useState('');
  const [members, setMembers] = useState({});
  const [locked, setLocked] = useState(false);
  const [roomId, setRoomId] = useRecoilState(roomIdState);
  const [roomTitle, setRoomTitle] = useRecoilState(roomTitleState);
  const loginUser = useRecoilValue(userState);
  
  // UI States - roomId가 있으면 전체 UI 표시
  const [showFileExplorer, setShowFileExplorer] = useState(!!roomId);
  const [showEditor, setShowEditor] = useState(!!roomId);
  const [showChat, setShowChat] = useState(!!roomId);
  const [activeFile, setActiveFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorLanguage, setEditorLanguage] = useState('javascript');
  const [openFiles, setOpenFiles] = useState([]);
  const [cursors, setCursors] = useState({});
  const [userColors, setUserColors] = useState({});
  
  const refUl = useRef();
  const refFile = useRef();
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const debounceTimer = useRef(null);
  const cursorUpdateTimer = useRef(null);

  useEffect(() => {
    // roomId가 있으면 UI 요소들 표시
    if (roomId) {
      setShowFileExplorer(true);
      setShowEditor(true);
      setShowChat(true);
    } else {
      setShowFileExplorer(false);
      setShowEditor(false);
      setShowChat(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    
    const unsubscribe = read(`rooms/${roomId}`, (data) => {
      const { key, locked, creator, members, chats } = data || {};
      if(roomId !== key) {
        setChats([]);
        return;
      }
      setLocked(locked);
      setCreator(creator);
      setMembers(members || {});
      if(locked && (!members || !members[loginUser.uid])) return;
      updateByPath(`rooms/${roomId}/members/${loginUser.uid}/count`, 0);
      setChats(toList(chats));
    });
    
    // 커서 데이터 구독
    const cursorUnsubscribe = read(`rooms/${roomId}/cursors`, (data) => {
      if (data) {
        const otherCursors = Object.entries(data)
          .filter(([uid]) => uid !== loginUser?.uid)
          .reduce((acc, [uid, cursor]) => {
            acc[uid] = cursor;
            return acc;
          }, {});
        setCursors(otherCursors);
        
        // 사용자별 고유 색상 할당
        const colors = {};
        const colorPalette = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];
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
    });
    
    return () => {
      unsubscribe();
      cursorUnsubscribe();
      // 컴포넌트 언마운트 시 자신의 커서 제거
      if (loginUser?.uid) {
        removeByPath(`rooms/${roomId}/cursors/${loginUser.uid}`);
      }
    };
  }, [db, roomId, loginUser, userColors]);

  useEffect(() => {
    if(locked && (!members || !members[loginUser.uid])) return;
    if(refUl.current) {
      refUl.current.scrollTop = refUl.current.scrollHeight;
    }
  });

  const sendMessage = () => {
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';
    if(isGuest) {
      customAlert('메시지 전송은 로그인이 필요합니다.');
      return;
    }
    
    write(`rooms/${roomId}/chats`, { 
      message,
      thumbnail: loginUser.photoURL,
      nickname: loginUser.displayName, 
      regdate: new Date(), 
    });
    
    const reqMembers = {};
    for(const uid in members) {
      reqMembers[uid] = {
        ...members[uid],
        count: uid === loginUser.uid ? members[uid].count : members[uid].count + 1
      };
    }
    updateByPath(`rooms/${roomId}/members`, reqMembers);
    setMessage("");
  };

  const sendImage = async (file) => {
    if(!file || file.type !== 'image/jpeg') return;
    
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';
    if(isGuest) {
      customAlert('이미지 전송은 로그인이 필요합니다.');
      return;
    }
    const res = await uploadFile(file);
    const imagePath = await getDownloadURL(res.ref);
    write(`rooms/${roomId}/chats`, { 
      message: "", 
      imagePath,
      thumbnail: loginUser.photoURL,
      nickname: loginUser.displayName, 
      regdate: new Date(), 
    });
    refFile.current.value = '';
  };

  const toggleLock = async () => {
    updateByPath(`rooms/${roomId}/locked`, !locked);
  };
  
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
  };
  
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
  };

  const isAllowed = () => {
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';
    if(isGuest) return false;
    return creator === loginUser?.uid || (members && members[loginUser?.uid]);
  };

  const handleFileSelect = (path, file) => {
    if (file.type === 'file') {
      setActiveFile({ path, ...file });
      setEditorContent(file.content || '');
      setEditorLanguage(file.language || 'javascript');
      
      // 열린 파일 목록에 추가
      if (!openFiles.find(f => f.path === path)) {
        setOpenFiles([...openFiles, { path, name: path.split('/').pop() }]);
      }
    }
  };

  const closeFile = (path) => {
    const newOpenFiles = openFiles.filter(f => f.path !== path);
    setOpenFiles(newOpenFiles);
    
    if (activeFile?.path === path) {
      if (newOpenFiles.length > 0) {
        const lastFile = newOpenFiles[newOpenFiles.length - 1];
        // 마지막 파일 열기 로직
        setActiveFile(null);
      } else {
        setActiveFile(null);
        setEditorContent('');
      }
    }
  };

  // 커서 위치 업데이트 함수
  const updateCursorPosition = () => {
    if (!monacoRef.current || !loginUser || !roomId) return;
    
    const position = monacoRef.current.getPosition();
    const selection = monacoRef.current.getSelection();
    
    if (!position || !selection) return;
    
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
    };
    
    updateByPath(`rooms/${roomId}/cursors/${loginUser.uid}`, cursorData);
  };
  
  // 커서 업데이트 디바운싱
  const handleCursorChange = () => {
    if (cursorUpdateTimer.current) {
      clearTimeout(cursorUpdateTimer.current);
    }
    cursorUpdateTimer.current = setTimeout(updateCursorPosition, 100);
  };

  const handleEditorChange = (value) => {
    setEditorContent(value);
    
    // 파일 내용 저장 (디바운싱)
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      if (activeFile) {
        const path = activeFile.path.replace(/\//g, '/children/');
        updateByPath(`rooms/${roomId}/files/${path}/content`, value);
      }
    }, 500);
  };

  const createNewRoom = async () => {
    const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';
    if(isGuest) {
      customAlert('방 생성은 로그인이 필요합니다.');
      return;
    }
    
    const roomName = prompt('새 채팅방 이름을 입력하세요:');
    if (roomName) {
      const newRoomKey = await write('rooms', { 
        title: roomName,
        locked: false,
        members: {
          [loginUser.uid]: {
            count: 0,
            profile: {
              nickname: loginUser.displayName,
              photoURL: loginUser.photoURL,
            }
          }
        },
        creator: loginUser.uid,
        created: new Date(),
        playground: {
          code: '// 코드를 입력하세요\n',
          language: 'javascript'
        }
      });
      
      if (newRoomKey) {
        // 새로 생성된 방으로 이동
        setRoomId(newRoomKey);
        const roomData = await read(`rooms/${newRoomKey}`);
        if (roomData && roomData.title) {
          setRoomTitle(roomData.title);
        }
      }
    }
  };

  // 항상 같은 레이아웃 사용
  return (
    <div className={styles.container}>
      {/* 좌측 사이드바 - 방 목록 (항상 표시) */}
      <div className={styles.roomListSidebar}>
        <RoomList onCreateRoom={createNewRoom} />
      </div>
      
      {/* 파일 탐색기 사이드바 */}
      {showFileExplorer && (
        <div className={styles.explorerSidebar}>
          <FileExplorer roomId={roomId} onFileSelect={handleFileSelect} />
        </div>
      )}
      
      {/* 메인 컨텐츠 영역 */}
      <div className={styles.mainArea}>
        {!roomId ? (
          // roomId가 없을 때는 선택 안내 메시지 표시
          <div className={styles.welcome}>
            <h2>채팅방을 선택하세요</h2>
            <p>좌측 목록에서 채팅방을 선택하거나 새로운 채팅방을 만들어보세요.</p>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <header className={styles.header}>
          <div className={styles.roomInfo}>
            <span className={styles.roomTitle}>{roomTitle}</span>
            {locked && <FontAwesomeIcon icon={faLock} />}
          </div>
          
          <div className={styles.actions}>
            <button 
              className={`${styles.viewBtn} ${showFileExplorer ? styles.active : ''}`}
              onClick={() => setShowFileExplorer(!showFileExplorer)}
              title="파일 탐색기"
            >
              <FontAwesomeIcon icon={faFolder} />
            </button>
            
            <button 
              className={`${styles.viewBtn} ${showEditor ? styles.active : ''}`}
              onClick={() => setShowEditor(!showEditor)}
              title="코드 에디터"
            >
              <FontAwesomeIcon icon={faCode} />
            </button>
            
            <button 
              className={`${styles.viewBtn} ${showChat ? styles.active : ''}`}
              onClick={() => setShowChat(!showChat)}
              title="채팅"
            >
              <FontAwesomeIcon icon={faComments} />
            </button>
            
            {/* 유저 목록 */}
            <Popover className={styles.memberPopup}>
              <Popover.Button className={styles.memberBtn}>
                <FontAwesomeIcon icon={faUserGroup} title="멤버 목록" />
              </Popover.Button>
              <Popover.Panel className={styles.memberPanel}>
                <div className={styles.memberHeader}>
                  <span>참여자 목록</span>
                </div>
                <ul className={styles.memberList}>
                  {members && Object.keys(members).length > 0 ? (
                    Object.keys(members).map(uid => {
                      const member = members[uid];
                      const { nickname, photoURL } = member.profile || {};
                      const isCreator = uid === creator;
                      const isMe = uid === loginUser?.uid;
                      const isGuest = uid.startsWith('guest_');
                      
                      const displayName = nickname || (isGuest ? `게스트${uid.split('_')[1]?.substring(0, 4)}` : 'Unknown');
                      const guestAvatar = "data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='30' height='30' fill='%23cccccc' rx='15'/%3E%3Ctext x='15' y='20' text-anchor='middle' fill='%23666' font-size='14' font-family='Arial'%3EG%3C/text%3E%3C/svg%3E";
                      const displayPhoto = photoURL || (isGuest ? guestAvatar : null);
                      
                      return (
                        <li key={uid} className={styles.memberItem}>
                          <div className={styles.memberInfo}>
                            {displayPhoto && (
                              displayPhoto.includes('data:') || displayPhoto.includes('placeholder') ? (
                                <img src={displayPhoto} alt="Profile" width={30} height={30} style={{borderRadius: '50%'}} />
                              ) : (
                                <Image src={displayPhoto} alt="Profile" width={30} height={30} />
                              )
                            )}
                            <div className={styles.memberName}>
                              <span>{displayName}</span>
                              <div className={styles.badges}>
                                {isCreator && <span className={styles.badge}>방장</span>}
                                {isMe && !isCreator && <span className={styles.badgeMe}>나</span>}
                                {isGuest && <span className={styles.badgeGuest}>게스트</span>}
                              </div>
                            </div>
                          </div>
                          {creator === loginUser?.uid && !isCreator && !isMe && (
                            <FontAwesomeIcon 
                              icon={faTimes}
                              className={styles.kickBtn}
                              title="강퇴"
                              onClick={() => kickMember(uid, displayName)}
                            />
                          )}
                        </li>
                      );
                    })
                  ) : (
                    <li className={styles.emptyMember}>
                      <span>참여자가 없습니다</span>
                    </li>
                  )}
                </ul>
              </Popover.Panel>
            </Popover>
            
            {/* 방장 전용 메뉴 */}
            {creator === loginUser?.uid && (
              <>
                <button 
                  className={styles.actionBtn}
                  onClick={toggleLock}
                  title={locked ? "공개방으로 전환" : "비공개방으로 전환"}
                >
                  <FontAwesomeIcon icon={locked ? faLock : faLockOpen} />
                </button>
                
                <button 
                  className={styles.actionBtn}
                  onClick={() => {
                    copyToClipboard(`${window.location.origin}/invite/${roomId}`);
                    customAlert('초대 링크가 복사되었습니다.');
                  }}
                  title="초대 링크 복사"
                >
                  <FontAwesomeIcon icon={faShareFromSquare} />
                </button>
                
                <button 
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={deleteRoom}
                  title="방 삭제"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            )}
          </div>
        </header>
        
        {/* 탭바 - 열린 파일들 */}
        {showEditor && openFiles.length > 0 && (
          <div className={styles.tabBar}>
            {openFiles.map(file => (
              <div 
                key={file.path}
                className={`${styles.tab} ${activeFile?.path === file.path ? styles.active : ''}`}
                onClick={() => handleFileSelect(file.path, file)}
              >
                <span>{file.name}</span>
                <FontAwesomeIcon 
                  icon={faTimes}
                  className={styles.closeTab}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(file.path);
                  }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* 컨텐츠 영역 */}
        <div className={styles.content}>
          {/* 에디터 영역 */}
          {showEditor && (
            <div className={styles.editorPane}>
              {activeFile ? (
                <MonacoEditorWithNoSSR
                  theme="vs-dark"
                  height="100%"
                  value={editorContent}
                  language={editorLanguage}
                  onChange={handleEditorChange}
                  onMount={(editor, monaco) => {
                    monacoRef.current = editor;
                    editorRef.current = editor;
                    
                    // 커서 위치 변경 이벤트 리스너
                    editor.onDidChangeCursorPosition(handleCursorChange);
                    editor.onDidChangeCursorSelection(handleCursorChange);
                    
                    // 다른 사용자 커서 표시
                    const decorations = [];
                    
                    const updateDecorations = () => {
                      const newDecorations = [];
                      
                      Object.entries(cursors).forEach(([uid, cursor]) => {
                        if (cursor && cursor.position && cursor.user) {
                          const color = userColors[uid] || '#ff6b6b';
                          
                          // 커서 위치 표시
                          newDecorations.push({
                            range: new monaco.Range(
                              cursor.position.lineNumber,
                              cursor.position.column,
                              cursor.position.lineNumber,
                              cursor.position.column + 1
                            ),
                            options: {
                              className: `cursor-${uid}`,
                              beforeContentClassName: `cursor-line-${uid}`,
                              afterContentClassName: `cursor-name-${uid}`,
                              hoverMessage: { value: cursor.user.displayName },
                              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                              zIndex: 100
                            }
                          });
                          
                          // 선택 영역 표시
                          if (cursor.selection && 
                              (cursor.selection.startLineNumber !== cursor.selection.endLineNumber ||
                               cursor.selection.startColumn !== cursor.selection.endColumn)) {
                            newDecorations.push({
                              range: new monaco.Range(
                                cursor.selection.startLineNumber,
                                cursor.selection.startColumn,
                                cursor.selection.endLineNumber,
                                cursor.selection.endColumn
                              ),
                              options: {
                                className: `selection-${uid}`,
                                stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
                              }
                            });
                          }
                        }
                      });
                      
                      // 이전 데코레이션 제거하고 새로운 것으로 교체
                      decorations.length = 0;
                      decorations.push(...editor.deltaDecorations(decorations, newDecorations));
                    };
                    
                    // 커서 데이터가 변경될 때마다 데코레이션 업데이트
                    const interval = setInterval(updateDecorations, 100);
                    
                    // cleanup
                    return () => {
                      clearInterval(interval);
                      editor.deltaDecorations(decorations, []);
                    };
                  }}
                />
              ) : (
                <div className={styles.noFile}>
                  <FontAwesomeIcon icon={faFolder} />
                  <p>파일을 선택하거나 새 파일을 만들어보세요</p>
                </div>
              )}
            </div>
          )}
          
          {/* 채팅 영역 */}
          {showChat && (
            <div className={styles.chatPane}>
              {locked && !isAllowed() ? (
                <div className={styles.lockScreen}>
                  <FontAwesomeIcon icon={faLock} />
                  <h2>비공개 채팅방</h2>
                  <p>이 채팅방은 참여자만 접근할 수 있습니다.</p>
                  {(!loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest') ? (
                    <p className={styles.guestInfo}>게스트는 비공개방에 접근할 수 없습니다.<br/>로그인 후 이용해 주세요.</p>
                  ) : (
                    <p className={styles.memberInfo}>방장이 초대해야 참여할 수 있습니다.</p>
                  )}
                </div>
              ) : (
                <>
                  <ul className={styles.messages} ref={refUl}>
                    {chats && chats.map(({ nickname, message, imagePath, regdate, thumbnail }, index) => (
                      <li className={styles.message} key={index}>
                        <div className={styles.thumbnail}>
                          {thumbnail && <Image src={thumbnail} alt="Profile" width={40} height={40} />}
                        </div>
                        <div className={styles.messageContent}>
                          <div className={styles.messageHeader}>
                            <span className={styles.nickname}>{nickname}</span>
                            <span className={styles.regdate}>{moment(regdate).format('HH:mm')}</span>
                          </div>
                          <div className={styles.messageBody}>
                            {imagePath ? <img src={imagePath} alt="Shared" /> : <span>{message}</span>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  
                  <div className={styles.messageSend}>
                    <input 
                      type="text" 
                      value={message}
                      onChange={({ target }) => setMessage(target.value)}
                      onKeyPress={({ key }) => key === 'Enter' && sendMessage()}
                      onPaste={({ clipboardData }) => {
                        if(clipboardData.items.length > 0) {
                          const [item] = clipboardData.items;
                          const file = item.getAsFile();
                          sendImage(file);
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                    />
                    <button onClick={() => refFile.current.click()} className={styles.imageBtn}>
                      <FontAwesomeIcon icon={faImage} />
                    </button>
                    <button onClick={sendMessage} className={styles.sendBtn}>
                      <FontAwesomeIcon icon={faPaperPlane} />
                    </button>
                    <input 
                      type="file" 
                      style={{ display: 'none' }} 
                      ref={refFile}
                      accept="image/jpeg"
                      onChange={({ target }) => sendImage(target.files[0])}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default RoomVSCode;