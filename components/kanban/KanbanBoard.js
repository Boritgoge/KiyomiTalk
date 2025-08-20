import React, { useState, useCallback, useMemo } from 'react';
import KanbanColumn from './KanbanColumn';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
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
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filters, setFilters] = useState({
    priority: [],
    tags: [],
    assignees: [],
    categories: []
  });

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
      
      // cardId가 null이면 새 카드 추가 (복사 기능용)
      if (cardId === null) {
        const newCard = {
          id: Date.now().toString(),
          ...updatedData
        };
        column.cards.push(newCard);
      } else {
        const cardIndex = column.cards.findIndex(card => card.id === cardId);
        column.cards[cardIndex] = { ...column.cards[cardIndex], ...updatedData };
      }
      
      return newColumns;
    });
  };

  // 모든 태그 수집
  const allTags = useMemo(() => {
    const tags = new Set();
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.tags) {
          card.tags.forEach(tag => tags.add(tag));
        }
      });
    });
    return Array.from(tags);
  }, [columns]);

  // 모든 카테고리 수집
  const allCategories = useMemo(() => {
    const categories = new Set();
    columns.forEach(column => {
      column.cards.forEach(card => {
        if (card.category) {
          categories.add(card.category);
        } else if (card.title) {
          const match = card.title.match(/^\[([^\]]+)\]/);
          if (match) {
            categories.add(match[1]);
          }
        }
      });
    });
    return Array.from(categories);
  }, [columns]);

  // 필터 토글
  const toggleFilter = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const index = newFilters[filterType].indexOf(value);
      if (index > -1) {
        newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
      } else {
        newFilters[filterType] = [...newFilters[filterType], value];
      }
      return newFilters;
    });
  };

  // 필터 초기화
  const clearFilters = () => {
    setFilters({
      priority: [],
      tags: [],
      assignees: [],
      categories: []
    });
    setSearchTerm('');
  };

  // 필터가 적용되었는지 확인
  const hasActiveFilters = useMemo(() => {
    return (
      filters.priority.length > 0 ||
      filters.tags.length > 0 ||
      filters.assignees.length > 0 ||
      filters.categories.length > 0 ||
      searchTerm.length > 0
    );
  }, [filters, searchTerm]);

  // 카드 필터링
  const getFilteredCards = useCallback((cards) => {
    return cards.filter(card => {
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = card.title?.toLowerCase().includes(searchLower);
        const descMatch = card.description?.toLowerCase().includes(searchLower);
        const tagMatch = card.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        if (!titleMatch && !descMatch && !tagMatch) return false;
      }

      // 우선순위 필터
      if (filters.priority.length > 0 && !filters.priority.includes(card.priority)) {
        return false;
      }

      // 태그 필터
      if (filters.tags.length > 0) {
        const hasMatchingTag = card.tags?.some(tag => filters.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // 카테고리 필터
      if (filters.categories.length > 0) {
        let cardCategory = card.category;
        if (!cardCategory && card.title) {
          const match = card.title.match(/^\[([^\]]+)\]/);
          if (match) {
            cardCategory = match[1];
          }
        }
        if (!cardCategory || !filters.categories.includes(cardCategory)) {
          return false;
        }
      }

      return true;
    });
  }, [searchTerm, filters]);

  // 필터링된 컬럼 데이터
  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      cards: getFilteredCards(column.cards)
    }));
  }, [columns, getFilteredCards]);

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
          <div className={styles.filterWrapper}>
            <button 
              className={`${styles.filterBtn} ${hasActiveFilters ? styles.active : ''}`}
              onClick={() => setShowFilterMenu(!showFilterMenu)}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filter
              {hasActiveFilters && (
                <span className={styles.filterCount}>
                  {filters.priority.length + filters.tags.length + filters.categories.length}
                </span>
              )}
            </button>
            
            {showFilterMenu && (
              <div className={styles.filterMenu}>
                <div className={styles.filterMenuHeader}>
                  <h3>필터</h3>
                  <button 
                    className={styles.clearFiltersBtn}
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                  >
                    <FontAwesomeIcon icon={faTimes} /> 초기화
                  </button>
                </div>
                
                <div className={styles.filterSection}>
                  <h4>우선순위</h4>
                  <div className={styles.filterOptions}>
                    {['high', 'medium', 'low'].map(priority => (
                      <label key={priority} className={styles.filterOption}>
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority)}
                          onChange={() => toggleFilter('priority', priority)}
                        />
                        <span className={`${styles.priorityLabel} ${styles[priority]}`}>
                          {priority === 'high' ? '높음' : priority === 'medium' ? '보통' : '낮음'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {allCategories.length > 0 && (
                  <div className={styles.filterSection}>
                    <h4>카테고리</h4>
                    <div className={styles.filterOptions}>
                      {allCategories.map(category => (
                        <label key={category} className={styles.filterOption}>
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => toggleFilter('categories', category)}
                          />
                          <span className={styles.categoryLabel}>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {allTags.length > 0 && (
                  <div className={styles.filterSection}>
                    <h4>태그</h4>
                    <div className={styles.filterTags}>
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          className={`${styles.filterTag} ${filters.tags.includes(tag) ? styles.active : ''}`}
                          onClick={() => toggleFilter('tags', tag)}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.boardContainer}>
        {filteredColumns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onAddCard={addNewCard}
            onDeleteCard={deleteCard}
            onEditCard={editCard}
            searchTerm={''}
            showAddCard={showAddCard === column.id}
            setShowAddCard={setShowAddCard}
          />
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;