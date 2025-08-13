import React, { useState, useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import CardDetailModal from './CardDetailModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faGripVertical,
  faFlag,
  faCalendar,
  faUser,
  faTimes,
  faSave,
  faCheckSquare,
  faCheck,
  faSquare
} from '@fortawesome/free-solid-svg-icons';
import styles from './KanbanCard.module.scss';

const KanbanCard = ({ card, columnId, board, boardId, onDragStart, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [editedDescription, setEditedDescription] = useState(card.description);
  const [editedPriority, setEditedPriority] = useState(card.priority);
  const [showActions, setShowActions] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [assigneeNames, setAssigneeNames] = useState([]);
  const loginUser = useRecoilValue(userState);
  
  // 게스트 여부 확인
  const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';

  // 담당자 이름 가져오기
  useEffect(() => {
    if (card.assignees && card.assignees.length > 0 && board && board.members) {
      const names = card.assignees.map(userId => {
        const member = board.members[userId];
        return member ? (member.displayName || member.email || '익명') : '알 수 없음';
      });
      setAssigneeNames(names);
    } else {
      setAssigneeNames([]);
    }
  }, [card.assignees, board]);

  const handleSaveEdit = () => {
    onEdit(columnId, card.id, {
      title: editedTitle,
      description: editedDescription,
      priority: editedPriority
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedTitle(card.title);
    setEditedDescription(card.description);
    setEditedPriority(card.priority);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('이 카드를 삭제하시겠습니까?')) {
      onDelete(columnId, card.id);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#ff6b6b';
      case 'medium': return '#feca57';
      case 'low': return '#48dbfb';
      default: return '#95a5a6';
    }
  };

  if (isEditing) {
    return (
      <div className={styles.cardEditMode}>
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className={styles.editTitleInput}
          autoFocus
        />
        <textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          className={styles.editDescriptionInput}
          rows="3"
        />
        <div className={styles.editPriorityWrapper}>
          <label>우선순위:</label>
          <select 
            value={editedPriority} 
            onChange={(e) => setEditedPriority(e.target.value)}
            className={styles.editPrioritySelect}
          >
            <option value="low">낮음</option>
            <option value="medium">보통</option>
            <option value="high">높음</option>
          </select>
        </div>
        <div className={styles.editActions}>
          <button onClick={handleSaveEdit} className={styles.saveEditBtn}>
            <FontAwesomeIcon icon={faSave} /> 저장
          </button>
          <button onClick={handleCancelEdit} className={styles.cancelEditBtn}>
            <FontAwesomeIcon icon={faTimes} /> 취소
          </button>
        </div>
      </div>
    );
  }

  const handleCardClick = (e) => {
    // 버튼 클릭이 아닌 경우에만 상세 모달 열기
    if (!e.target.closest('button')) {
      setShowDetailModal(true);
    }
  };

  const handleUpdateFromModal = (updatedCard) => {
    onEdit(columnId, card.id, updatedCard);
  };

  // 체크리스트 진행률 계산
  const getChecklistProgress = () => {
    if (!card.checklist || card.checklist.length === 0) return null;
    const completed = card.checklist.filter(item => item.completed).length;
    const total = card.checklist.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const checklistProgress = getChecklistProgress();

  return (
    <>
      <div 
        className={styles.card}
        draggable={!isGuest}
        onDragStart={(e) => !isGuest && onDragStart(e, card.id, columnId)}
        onMouseEnter={() => !isGuest && setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onClick={handleCardClick}
        style={{ cursor: isGuest ? 'pointer' : 'move' }}
      >
      <div className={styles.dragHandle}>
        <FontAwesomeIcon icon={faGripVertical} />
      </div>
      
      {showActions && !isGuest && (
        <div className={styles.cardActions}>
          <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button onClick={handleDelete} className={styles.deleteBtn}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      )}

      <div className={styles.cardHeader}>
        <h4 className={styles.cardTitle}>{card.title}</h4>
        <div 
          className={styles.priorityBadge}
          style={{ backgroundColor: getPriorityColor(card.priority) }}
        >
          <FontAwesomeIcon icon={faFlag} />
          <span>{card.priority}</span>
        </div>
      </div>

      {card.description && (
        <div className={styles.cardDescription}>{card.description}</div>
      )}

      {card.tags && card.tags.length > 0 && (
        <div className={styles.cardTags}>
          {card.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.cardMeta}>
          {checklistProgress && (
            <div className={styles.metaItem}>
              <FontAwesomeIcon icon={faCheckSquare} />
              <span>{checklistProgress.completed}/{checklistProgress.total}</span>
              <div className={styles.checklistProgressBar}>
                <div 
                  className={styles.checklistProgressFill}
                  style={{ width: `${checklistProgress.percentage}%` }}
                />
              </div>
              <div className={styles.checklistTooltip}>
                <div className={styles.checklistTooltipHeader}>
                  체크리스트 ({checklistProgress.percentage}% 완료)
                </div>
                <div className={styles.checklistTooltipContent}>
                  {card.checklist.map((item, index) => (
                    <div 
                      key={item.id || index} 
                      className={`${styles.checklistTooltipItem} ${item.completed ? styles.completed : styles.pending}`}
                    >
                      <FontAwesomeIcon icon={item.completed ? faCheck : faSquare} />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {card.dueDate && (
            <div className={styles.metaItem}>
              <FontAwesomeIcon icon={faCalendar} />
              <span>{card.dueDate}</span>
            </div>
          )}
          {assigneeNames.length > 0 && (
            <div className={styles.metaItem}>
              <FontAwesomeIcon icon={faUser} />
              <span>{assigneeNames.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {showDetailModal && board && (
      <CardDetailModal
        card={card}
        board={board}
        boardId={boardId}
        onClose={() => setShowDetailModal(false)}
        onUpdate={handleUpdateFromModal}
      />
    )}
  </>
);
};

export default KanbanCard;