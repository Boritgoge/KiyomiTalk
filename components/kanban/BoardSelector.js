import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faSearch, 
  faStar, 
  faUsers, 
  faClock,
  faTrash,
  faEdit,
  faClipboard
} from '@fortawesome/free-solid-svg-icons';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { read, write, updateByPath, removeByPath } from '../common/FirebaseDatabase';
import styles from './BoardSelector.module.scss';

const BoardSelector = ({ onSelectBoard }) => {
  const [boards, setBoards] = useState([]);
  const [userBoards, setUserBoards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const loginUser = useRecoilValue(userState);
  const router = useRouter();

  useEffect(() => {
    if (!loginUser?.uid) return;

    // 사용자의 보드 목록 가져오기
    const unsubscribeUser = read(`users/${loginUser.uid}/boards`, (boardIds) => {
      if (!boardIds) {
        setUserBoards([]);
        return;
      }

      const boardList = [];
      const boardPromises = Object.keys(boardIds).map(boardId => {
        return new Promise((resolve) => {
          read(`boards/${boardId}`, (boardData) => {
            if (boardData) {
              boardList.push(boardData);
            }
            resolve();
          }, { once: true });
        });
      });

      Promise.all(boardPromises).then(() => {
        setUserBoards(boardList);
      });
    });

    return () => {
      unsubscribeUser();
    };
  }, [loginUser]);

  const createNewBoard = async () => {
    if (!newBoardTitle.trim() || !loginUser?.uid) return;

    const boardId = Date.now().toString();
    const newBoard = {
      id: boardId,
      title: newBoardTitle,
      description: newBoardDescription,
      owner: loginUser.uid,
      members: {
        [loginUser.uid]: {
          role: 'owner',
          displayName: loginUser.displayName || '익명',
          email: loginUser.email,
          photoURL: loginUser.photoURL || null,
          joinedAt: Date.now()
        }
      },
      visibility: 'private',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: {
        allowMemberInvite: true,
        requireApproval: false,
        defaultColumnIds: ['todo', 'in-progress', 'review', 'done']
      }
    };

    // 보드 생성
    updateByPath(`boards/${boardId}`, newBoard);

    // 사용자 보드 목록에 추가
    updateByPath(`users/${loginUser.uid}/boards/${boardId}`, true);

    // 기본 컬럼 생성
    const defaultColumns = [
      { id: 'todo', title: 'To Do', color: '#ff6b6b', position: 0 },
      { id: 'in-progress', title: 'In Progress', color: '#4ecdc4', position: 1 },
      { id: 'review', title: 'Review', color: '#45b7d1', position: 2 },
      { id: 'done', title: 'Done', color: '#96ceb4', position: 3 }
    ];

    defaultColumns.forEach(column => {
      updateByPath(`columns/${boardId}/${column.id}`, {
        ...column,
        boardId,
        createdAt: Date.now(),
        createdBy: loginUser.uid
      });
    });

    setShowCreateModal(false);
    setNewBoardTitle('');
    setNewBoardDescription('');
    
    // 새로 생성한 보드로 이동
    if (onSelectBoard) {
      onSelectBoard(boardId);
    }
  };

  const deleteBoard = (boardId, e) => {
    e.stopPropagation();
    if (!confirm('정말로 이 보드를 삭제하시겠습니까?')) return;

    // 보드 삭제
    removeByPath(`boards/${boardId}`);
    removeByPath(`columns/${boardId}`);
    removeByPath(`cards/${boardId}`);
    removeByPath(`activities/${boardId}`);
    
    // 사용자 보드 목록에서 제거
    removeByPath(`users/${loginUser.uid}/boards/${boardId}`);
  };

  const filteredBoards = userBoards.filter(board =>
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentBoards = [...userBoards]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 3);

  const teamBoards = userBoards.filter(board => 
    Object.keys(board.members || {}).length > 1
  );

  return (
    <div className={styles.boardSelector}>
      <div className={styles.header}>
        <h2>내 워크스페이스</h2>
        <button 
          className={styles.createBtn}
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          새 보드 만들기
        </button>
      </div>

      <div className={styles.searchBox}>
        <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="보드 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {recentBoards.length > 0 && (
        <div className={styles.section}>
          <h3>
            <FontAwesomeIcon icon={faClock} />
            최근 보드
          </h3>
          <div className={styles.boardGrid}>
            {recentBoards.map(board => (
              <div 
                key={board.id}
                className={styles.boardCard}
                onClick={() => onSelectBoard && onSelectBoard(board.id)}
              >
                <div className={styles.boardHeader}>
                  <FontAwesomeIcon icon={faClipboard} className={styles.boardIcon} />
                  <div className={styles.boardActions}>
                    {board.owner === loginUser?.uid && (
                      <button 
                        className={styles.deleteBtn}
                        onClick={(e) => deleteBoard(board.id, e)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
                <h4>{board.title}</h4>
                <p>{board.description || '설명 없음'}</p>
                <div className={styles.boardMeta}>
                  <span>
                    <FontAwesomeIcon icon={faUsers} />
                    {Object.keys(board.members || {}).length}명
                  </span>
                  <span className={styles.updatedAt}>
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamBoards.length > 0 && (
        <div className={styles.section}>
          <h3>
            <FontAwesomeIcon icon={faUsers} />
            팀 보드
          </h3>
          <div className={styles.boardGrid}>
            {teamBoards.map(board => (
              <div 
                key={board.id}
                className={styles.boardCard}
                onClick={() => onSelectBoard && onSelectBoard(board.id)}
              >
                <div className={styles.boardHeader}>
                  <FontAwesomeIcon icon={faClipboard} className={styles.boardIcon} />
                  <div className={styles.boardActions}>
                    {board.owner === loginUser?.uid && (
                      <button 
                        className={styles.deleteBtn}
                        onClick={(e) => deleteBoard(board.id, e)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
                <h4>{board.title}</h4>
                <p>{board.description || '설명 없음'}</p>
                <div className={styles.boardMeta}>
                  <span>
                    <FontAwesomeIcon icon={faUsers} />
                    {Object.keys(board.members || {}).length}명
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredBoards.length === 0 && searchTerm && (
        <div className={styles.emptyState}>
          <p>검색 결과가 없습니다</p>
        </div>
      )}

      {userBoards.length === 0 && !searchTerm && (
        <div className={styles.emptyState}>
          <FontAwesomeIcon icon={faClipboard} className={styles.emptyIcon} />
          <h3>아직 보드가 없습니다</h3>
          <p>첫 번째 보드를 만들어보세요!</p>
          <button 
            className={styles.createBtnLarge}
            onClick={() => setShowCreateModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} />
            새 보드 만들기
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>새 보드 만들기</h3>
            <input
              type="text"
              placeholder="보드 제목"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              className={styles.input}
              autoFocus
            />
            <textarea
              placeholder="보드 설명 (선택사항)"
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              className={styles.textarea}
              rows="3"
            />
            <div className={styles.modalActions}>
              <button 
                className={styles.confirmBtn}
                onClick={createNewBoard}
                disabled={!newBoardTitle.trim()}
              >
                만들기
              </button>
              <button 
                className={styles.cancelBtn}
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardTitle('');
                  setNewBoardDescription('');
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardSelector;