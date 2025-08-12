import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { read, updateByPath, removeByPath } from '../common/FirebaseDatabase';
import KanbanColumn from './KanbanColumn';
import MemberManagement from './MemberManagement';
import FilterPanel from './FilterPanel';
import NotificationSystem, { createNotification } from './NotificationSystem';
import InviteModal from './InviteModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft,
  faSearch, 
  faFilter,
  faUsers,
  faGear,
  faShareAlt
} from '@fortawesome/free-solid-svg-icons';
import styles from './KanbanBoard.module.scss';

const KanbanBoardFirebase = ({ boardId, onBack }) => {
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCard, setShowAddCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filteredCards, setFilteredCards] = useState(null);
  const [activeFilters, setActiveFilters] = useState(null);
  const loginUser = useRecoilValue(userState);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!boardId || !loginUser?.uid) return;

    // 보드 정보 구독
    const unsubscribeBoard = read(`boards/${boardId}`, (boardData) => {
      if (boardData) {
        setBoard(boardData);
        // 사용자가 멤버인지 확인
        if (!boardData.members || !boardData.members[loginUser.uid]) {
          console.error('이 보드에 접근 권한이 없습니다.');
          onBack && onBack();
        }
      } else {
        console.error('보드를 찾을 수 없습니다.');
        onBack && onBack();
      }
    });

    // 컬럼 정보 구독
    const unsubscribeColumns = read(`columns/${boardId}`, (columnsData) => {
      if (columnsData) {
        const columnsList = Object.values(columnsData).sort((a, b) => a.position - b.position);
        setColumns(columnsList);
      } else {
        setColumns([]);
      }
      setLoading(false);
    });

    // 카드 정보 구독
    const unsubscribeCards = read(`cards/${boardId}`, (cardsData) => {
      setCards(cardsData || {});
    });

    // 보드 최근 업데이트 시간 갱신
    updateByPath(`boards/${boardId}/updatedAt`, Date.now());
    
    // 사용자의 최근 보드 목록 업데이트
    updateByPath(`users/${loginUser.uid}/recentBoards/${boardId}`, Date.now());

    return () => {
      unsubscribeBoard();
      unsubscribeColumns();
      unsubscribeCards();
    };
  }, [boardId, loginUser, onBack]);

  const handleDragStart = (e, cardId, sourceColumnId) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColumnId', sourceColumnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');

    if (sourceColumnId === targetColumnId) return;

    // Firebase에서 카드 이동
    const card = cards[cardId];
    if (card) {
      updateByPath(`cards/${boardId}/${cardId}/columnId`, targetColumnId);
      updateByPath(`cards/${boardId}/${cardId}/movedAt`, Date.now());
      updateByPath(`cards/${boardId}/${cardId}/movedBy`, loginUser.uid);

      // 활동 로그 추가
      const activityId = Date.now().toString();
      updateByPath(`activities/${boardId}/${activityId}`, {
        id: activityId,
        boardId,
        type: 'card_moved',
        userId: loginUser.uid,
        userName: loginUser.displayName || '익명',
        targetId: cardId,
        targetTitle: card.title,
        fromColumn: sourceColumnId,
        toColumn: targetColumnId,
        description: `카드를 ${sourceColumnId}에서 ${targetColumnId}로 이동`,
        timestamp: Date.now()
      });

      // 보드 업데이트 시간 갱신
      updateByPath(`boards/${boardId}/updatedAt`, Date.now());
    }
  };

  const addNewCard = (columnId, cardData) => {
    const cardId = Date.now().toString();
    const newCard = {
      id: cardId,
      boardId,
      columnId,
      title: cardData.title,
      description: cardData.description,
      priority: cardData.priority,
      status: 'active',
      position: Object.values(cards).filter(c => c.columnId === columnId).length,
      assignees: cardData.assignees || [],
      tags: cardData.tags || [],
      createdBy: loginUser.uid,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    updateByPath(`cards/${boardId}/${cardId}`, newCard);

    // 할당된 사용자들에게 알림 생성
    if (cardData.assignees && cardData.assignees.length > 0) {
      cardData.assignees.forEach(userId => {
        if (userId !== loginUser.uid) {
          createNotification(userId, {
            type: 'card_assigned',
            boardId,
            cardId,
            title: '새 카드가 할당되었습니다',
            description: `"${cardData.title}" 카드가 할당되었습니다`,
            fromUser: loginUser.uid,
            fromUserName: loginUser.displayName || '익명'
          });
        }
      });
    }

    // 활동 로그 추가
    const activityId = Date.now().toString();
    updateByPath(`activities/${boardId}/${activityId}`, {
      id: activityId,
      boardId,
      type: 'card_created',
      userId: loginUser.uid,
      userName: loginUser.displayName || '익명',
      targetId: cardId,
      targetTitle: newCard.title,
      description: `새 카드 생성`,
      timestamp: Date.now()
    });

    setShowAddCard(null);
  };

  const deleteCard = (columnId, cardId) => {
    removeByPath(`cards/${boardId}/${cardId}`);

    // 활동 로그 추가
    const activityId = Date.now().toString();
    updateByPath(`activities/${boardId}/${activityId}`, {
      id: activityId,
      boardId,
      type: 'card_deleted',
      userId: loginUser.uid,
      userName: loginUser.displayName || '익명',
      targetId: cardId,
      description: `카드 삭제`,
      timestamp: Date.now()
    });
  };

  const editCard = (columnId, cardId, updatedData) => {
    updateByPath(`cards/${boardId}/${cardId}/title`, updatedData.title);
    updateByPath(`cards/${boardId}/${cardId}/description`, updatedData.description);
    updateByPath(`cards/${boardId}/${cardId}/priority`, updatedData.priority);
    updateByPath(`cards/${boardId}/${cardId}/updatedAt`, Date.now());

    // 활동 로그 추가
    const activityId = Date.now().toString();
    updateByPath(`activities/${boardId}/${activityId}`, {
      id: activityId,
      boardId,
      type: 'card_updated',
      userId: loginUser.uid,
      userName: loginUser.displayName || '익명',
      targetId: cardId,
      targetTitle: updatedData.title,
      description: `카드 수정`,
      timestamp: Date.now()
    });
  };

  // 컬럼별 카드 정리
  const getColumnCards = (columnId) => {
    const cardsToFilter = filteredCards || cards;
    return Object.values(cardsToFilter)
      .filter(card => card.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  };

  // 필터 적용 핸들러
  const handleApplyFilter = (filtered, filters) => {
    if (filtered === null) {
      setFilteredCards(null);
      setActiveFilters(null);
    } else {
      const filteredObj = {};
      filtered.forEach(card => {
        filteredObj[card.id] = card;
      });
      setFilteredCards(filteredObj);
      setActiveFilters(filters);
    }
    setShowFilterPanel(false);
  };

  if (loading) {
    return <div className={styles.loading}>보드를 불러오는 중...</div>;
  }

  if (!board) {
    return <div className={styles.error}>보드를 찾을 수 없습니다.</div>;
  }

  return (
    <div className={styles.kanbanContainer}>
      <div className={styles.kanbanHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1 className={styles.title}>{board.title}</h1>
          <div className={styles.boardMeta}>
            <button 
              className={styles.membersBtn}
              onClick={() => setShowMemberModal(true)}
            >
              <FontAwesomeIcon icon={faUsers} />
              {Object.keys(board.members || {}).length}
            </button>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="카드 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button 
            className={`${styles.filterBtn} ${activeFilters ? styles.active : ''}`}
            onClick={() => setShowFilterPanel(true)}
          >
            <FontAwesomeIcon icon={faFilter} />
            필터 {activeFilters && '●'}
          </button>
          <button className={styles.settingsBtn}>
            <FontAwesomeIcon icon={faGear} />
          </button>
          <button 
            className={styles.shareBtn}
            onClick={() => setShowInviteModal(true)}
            title="초대 링크 공유"
          >
            <FontAwesomeIcon icon={faShareAlt} />
          </button>
          <NotificationSystem boardId={boardId} />
        </div>
      </div>

      <div className={styles.boardContainer}>
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={{
              ...column,
              cards: getColumnCards(column.id)
            }}
            board={board}
            boardId={boardId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onAddCard={addNewCard}
            onDeleteCard={deleteCard}
            onEditCard={editCard}
            searchTerm={searchTerm}
            showAddCard={showAddCard === column.id}
            setShowAddCard={setShowAddCard}
          />
        ))}
      </div>

      {showMemberModal && (
        <MemberManagement
          boardId={boardId}
          board={board}
          onClose={() => setShowMemberModal(false)}
        />
      )}

      {showFilterPanel && (
        <FilterPanel
          board={board}
          cards={cards}
          members={Object.entries(board.members || {}).map(([uid, member]) => ({ uid, ...member }))}
          onApplyFilter={handleApplyFilter}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {showInviteModal && (
        <InviteModal
          boardId={boardId}
          board={board}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

export default KanbanBoardFirebase;