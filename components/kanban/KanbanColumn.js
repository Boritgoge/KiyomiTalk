import React, { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import KanbanCard from './KanbanCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import styles from './KanbanColumn.module.scss';

const KanbanColumn = ({ 
  column, 
  board,
  boardId,
  onDragStart, 
  onDragOver, 
  onDrop, 
  onAddCard,
  onDeleteCard,
  onEditCard,
  searchTerm,
  showAddCard,
  setShowAddCard
}) => {
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [newCardPriority, setNewCardPriority] = useState('medium');
  const [newCardCategory, setNewCardCategory] = useState('');
  const loginUser = useRecoilValue(userState);
  
  // 게스트 여부 확인
  const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';

  const filteredCards = column.cards.filter(card => 
    searchTerm === '' || 
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      const titleWithCategory = newCardCategory ? `[${newCardCategory}] ${newCardTitle}` : newCardTitle;
      onAddCard(column.id, {
        title: titleWithCategory,
        description: newCardDescription,
        priority: newCardPriority,
        category: newCardCategory,
        tags: []
      });
      setNewCardTitle('');
      setNewCardDescription('');
      setNewCardPriority('medium');
      setNewCardCategory('');
    }
  };

  const handleCancelAdd = () => {
    setShowAddCard(null);
    setNewCardTitle('');
    setNewCardDescription('');
    setNewCardPriority('medium');
    setNewCardCategory('');
  };

  return (
    <div 
      className={styles.column}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className={styles.columnHeader} style={{ borderTopColor: column.color }}>
        <div className={styles.columnTitleWrapper}>
          <h3 className={styles.columnTitle}>{column.title}</h3>
          <span className={styles.cardCount}>{filteredCards.length}</span>
        </div>
        <div className={styles.columnActions}>
          {!isGuest && (
            <button 
              className={styles.addBtn}
              onClick={() => setShowAddCard(column.id)}
              title="카드 추가"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          )}
          <button className={styles.moreBtn}>
            <FontAwesomeIcon icon={faEllipsisH} />
          </button>
        </div>
      </div>

      <div className={styles.cardList}>
        {showAddCard && !isGuest && (
          <div className={styles.addCardForm}>
            <input
              type="text"
              placeholder="카드 제목을 입력하세요..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className={styles.cardTitleInput}
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && handleAddCard()}
            />
            <textarea
              placeholder="설명을 입력하세요..."
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              className={styles.cardDescriptionInput}
              rows="3"
            />
            <div className={styles.categorySelector}>
              <label>카테고리:</label>
              <select 
                value={newCardCategory} 
                onChange={(e) => setNewCardCategory(e.target.value)}
                className={styles.categorySelect}
              >
                <option value="">카테고리 선택</option>
                <option value="공통">공통</option>
                <option value="기획">기획</option>
                <option value="디자인">디자인</option>
                <option value="개발">개발</option>
                <option value="테스트">테스트</option>
                <option value="배포">배포</option>
                <option value="버그">버그</option>
                <option value="개선">개선</option>
                <option value="문서">문서</option>
              </select>
            </div>
            <div className={styles.prioritySelector}>
              <label>우선순위:</label>
              <select 
                value={newCardPriority} 
                onChange={(e) => setNewCardPriority(e.target.value)}
                className={styles.prioritySelect}
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button 
                className={styles.saveBtn}
                onClick={handleAddCard}
              >
                카드 추가
              </button>
              <button 
                className={styles.cancelBtn}
                onClick={handleCancelAdd}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {filteredCards.map(card => (
          <KanbanCard
            key={card.id}
            card={card}
            columnId={column.id}
            board={board}
            boardId={boardId}
            onDragStart={onDragStart}
            onDelete={onDeleteCard}
            onEdit={onEditCard}
          />
        ))}

        {filteredCards.length === 0 && !showAddCard && (
          <div className={styles.emptyState}>
            <p>No cards yet</p>
            <button 
              className={styles.emptyAddBtn}
              onClick={() => setShowAddCard(column.id)}
            >
              <FontAwesomeIcon icon={faPlus} /> Add a card
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;