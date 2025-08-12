import React, { useState, useCallback } from 'react';
import KanbanColumn from './KanbanColumn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter } from '@fortawesome/free-solid-svg-icons';
import styles from './KanbanBoard.module.scss';

const KanbanBoard = () => {
  const [columns, setColumns] = useState([
    {
      id: 'todo',
      title: 'To Do',
      color: '#ff6b6b',
      cards: [
        { id: '1', title: '프로젝트 계획 수립', description: '2024년 1분기 프로젝트 로드맵 작성', priority: 'high', tags: ['planning'] },
        { id: '2', title: 'UI 디자인 검토', description: '새로운 대시보드 UI 목업 검토 및 피드백', priority: 'medium', tags: ['design', 'ui'] }
      ]
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: '#4ecdc4',
      cards: [
        { id: '3', title: 'API 개발', description: 'REST API 엔드포인트 구현', priority: 'high', tags: ['backend', 'api'] }
      ]
    },
    {
      id: 'review',
      title: 'Review',
      color: '#45b7d1',
      cards: [
        { id: '4', title: '코드 리뷰', description: '풀 리퀘스트 #123 검토', priority: 'medium', tags: ['review'] }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      color: '#96ceb4',
      cards: [
        { id: '5', title: '데이터베이스 마이그레이션', description: 'PostgreSQL 업그레이드 완료', priority: 'low', tags: ['database'] }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCard, setShowAddCard] = useState(null);

  const handleDragStart = (e, cardId, sourceColumnId) => {
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('sourceColumnId', sourceColumnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');

    if (sourceColumnId === targetColumnId) return;

    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const sourceColumn = newColumns.find(col => col.id === sourceColumnId);
      const targetColumn = newColumns.find(col => col.id === targetColumnId);
      
      const cardIndex = sourceColumn.cards.findIndex(card => card.id === cardId);
      const [movedCard] = sourceColumn.cards.splice(cardIndex, 1);
      targetColumn.cards.push(movedCard);
      
      return newColumns;
    });
  };

  const addNewCard = (columnId, cardData) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const column = newColumns.find(col => col.id === columnId);
      const newCard = {
        id: Date.now().toString(),
        ...cardData
      };
      column.cards.push(newCard);
      return newColumns;
    });
    setShowAddCard(null);
  };

  const deleteCard = (columnId, cardId) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const column = newColumns.find(col => col.id === columnId);
      column.cards = column.cards.filter(card => card.id !== cardId);
      return newColumns;
    });
  };

  const editCard = (columnId, cardId, updatedData) => {
    setColumns(prevColumns => {
      const newColumns = [...prevColumns];
      const column = newColumns.find(col => col.id === columnId);
      const cardIndex = column.cards.findIndex(card => card.id === cardId);
      column.cards[cardIndex] = { ...column.cards[cardIndex], ...updatedData };
      return newColumns;
    });
  };

  return (
    <div className={styles.kanbanContainer}>
      <div className={styles.kanbanHeader}>
        <h1 className={styles.title}>Project Management Board</h1>
        <div className={styles.headerActions}>
          <div className={styles.searchBox}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button className={styles.filterBtn}>
            <FontAwesomeIcon icon={faFilter} />
            Filter
          </button>
        </div>
      </div>

      <div className={styles.boardContainer}>
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
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
    </div>
  );
};

export default KanbanBoard;