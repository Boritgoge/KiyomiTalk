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
  faSquare,
  faEllipsisV,
  faCopy,
  faArchive,
  faExclamationTriangle,
  faPalette,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import styles from './KanbanCard.module.scss';

const KanbanCard = ({ card, columnId, board, boardId, onDragStart, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // 제목에서 카테고리 추출
  const extractCategoryFromTitle = (titleStr) => {
    const match = titleStr.match(/^\[([^\]]+)\]\s*(.+)/);
    if (match) {
      return { category: match[1], titleWithoutCategory: match[2] };
    }
    return { category: '', titleWithoutCategory: titleStr };
  };
  
  const { category: initialCategory, titleWithoutCategory } = extractCategoryFromTitle(card.title);
  
  const [editedTitle, setEditedTitle] = useState(titleWithoutCategory);
  const [editedCategory, setEditedCategory] = useState(card.category || initialCategory || '');
  const [editedDescription, setEditedDescription] = useState(card.description);
  const [editedPriority, setEditedPriority] = useState(card.priority);
  const [showActions, setShowActions] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [assigneeNames, setAssigneeNames] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [cardColor, setCardColor] = useState(card.color || null);
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
    const titleWithCategory = editedCategory ? `[${editedCategory}] ${editedTitle}` : editedTitle;
    onEdit(columnId, card.id, {
      title: titleWithCategory,
      category: editedCategory,
      description: editedDescription,
      priority: editedPriority
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    const { category, titleWithoutCategory } = extractCategoryFromTitle(card.title);
    setEditedTitle(titleWithoutCategory);
    setEditedCategory(card.category || category || '');
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
        <div className={styles.editCategoryWrapper}>
          <label>카테고리:</label>
          <select 
            value={editedCategory} 
            onChange={(e) => setEditedCategory(e.target.value)}
            className={styles.editCategorySelect}
          >
            <option value="">카테고리 없음</option>
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
        <input
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          className={styles.editTitleInput}
          placeholder="제목을 입력하세요"
          autoFocus
        />
        <textarea
          value={editedDescription}
          onChange={(e) => setEditedDescription(e.target.value)}
          className={styles.editDescriptionInput}
          rows="3"
          placeholder="설명을 입력하세요"
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
    if (!e.target.closest('button') && !e.target.closest(`.${styles.moreMenu}`)) {
      setShowDetailModal(true);
    }
  };

  // 카드 복사
  const handleDuplicateCard = () => {
    const duplicatedCard = {
      title: `${card.title} (복사본)`,
      description: card.description,
      priority: card.priority,
      tags: card.tags || [],
      category: card.category,
      checklist: card.checklist ? card.checklist.map(item => ({ ...item, completed: false })) : [],
      color: card.color
    };
    onEdit(columnId, null, duplicatedCard); // null ID로 새 카드 생성
    setShowMoreMenu(false);
  };

  // 카드 보관
  const handleArchiveCard = () => {
    if (window.confirm('이 카드를 보관하시겠습니까?')) {
      onEdit(columnId, card.id, { archived: true, archivedAt: new Date().toISOString() });
      setShowMoreMenu(false);
    }
  };

  // 카드 색상 변경
  const handleColorChange = (color) => {
    setCardColor(color);
    onEdit(columnId, card.id, { color });
    setShowMoreMenu(false);
  };

  // 긴급 표시 토글
  const handleToggleUrgent = () => {
    const newPriority = card.priority === 'urgent' ? 'high' : 'urgent';
    onEdit(columnId, card.id, { priority: newPriority });
    setShowMoreMenu(false);
  };

  // 예상 소요 시간 설정
  const handleSetEstimate = () => {
    const estimate = window.prompt('예상 소요 시간을 입력하세요 (예: 2h, 3d)', card.estimate || '');
    if (estimate !== null) {
      onEdit(columnId, card.id, { estimate });
      setShowMoreMenu(false);
    }
  };

  const cardColors = [
    { name: '기본', value: null },
    { name: '빨강', value: '#ffe4e1' },
    { name: '노랑', value: '#fff9c4' },
    { name: '초록', value: '#e8f5e9' },
    { name: '파랑', value: '#e3f2fd' },
    { name: '보라', value: '#f3e5f5' },
    { name: '회색', value: '#f5f5f5' }
  ];

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
        draggable={!isGuest && !card.archived}
        onDragStart={(e) => !isGuest && !card.archived && onDragStart(e, card.id, columnId)}
        onMouseEnter={() => !isGuest && setShowActions(true)}
        onMouseLeave={() => {
          setShowActions(false);
          setShowMoreMenu(false);
        }}
        onClick={handleCardClick}
        style={{ 
          cursor: isGuest ? 'pointer' : 'move',
          backgroundColor: cardColor || 'transparent',
          opacity: card.archived ? 0.6 : 1
        }}
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
        <div className={styles.cardHeaderActions}>
          {card.priority === 'urgent' && (
            <div className={styles.urgentBadge}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
          )}
          <div 
            className={styles.priorityBadge}
            style={{ backgroundColor: getPriorityColor(card.priority === 'urgent' ? 'high' : card.priority) }}
          >
            <FontAwesomeIcon icon={faFlag} />
            <span>{card.priority === 'urgent' ? '긴급' : card.priority}</span>
          </div>
          <button 
            className={styles.moreBtn}
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreMenu(!showMoreMenu);
            }}
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          
          {showMoreMenu && (
            <div className={styles.moreMenu}>
              <button onClick={handleDuplicateCard} className={styles.moreMenuItem}>
                <FontAwesomeIcon icon={faCopy} />
                <span>카드 복사</span>
              </button>
              <button onClick={handleArchiveCard} className={styles.moreMenuItem}>
                <FontAwesomeIcon icon={faArchive} />
                <span>보관</span>
              </button>
              <button onClick={handleToggleUrgent} className={styles.moreMenuItem}>
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>{card.priority === 'urgent' ? '긴급 해제' : '긴급 표시'}</span>
              </button>
              <button onClick={handleSetEstimate} className={styles.moreMenuItem}>
                <FontAwesomeIcon icon={faClock} />
                <span>예상 시간 {card.estimate ? `(${card.estimate})` : ''}</span>
              </button>
              <div className={styles.menuDivider}></div>
              <div className={styles.colorPicker}>
                <span className={styles.colorLabel}>
                  <FontAwesomeIcon icon={faPalette} /> 카드 색상
                </span>
                <div className={styles.colorOptions}>
                  {cardColors.map(color => (
                    <button
                      key={color.name}
                      className={`${styles.colorOption} ${cardColor === color.value ? styles.selected : ''}`}
                      style={{ backgroundColor: color.value || '#fff' }}
                      onClick={() => handleColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
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
          {card.estimate && (
            <div className={styles.metaItem}>
              <FontAwesomeIcon icon={faClock} />
              <span>{card.estimate}</span>
            </div>
          )}
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