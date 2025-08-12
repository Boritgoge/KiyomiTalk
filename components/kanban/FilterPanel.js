import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter,
  faTimes,
  faUser,
  faTag,
  faCalendar,
  faFlag,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import styles from './FilterPanel.module.scss';

const FilterPanel = ({ board, cards, members, onApplyFilter, onClose }) => {
  const [filters, setFilters] = useState({
    assignee: '',
    priority: '',
    tags: [],
    dueDateRange: '',
    status: 'active',
    searchText: ''
  });

  // 모든 태그 수집
  const allTags = [...new Set(
    Object.values(cards).flatMap(card => card.tags || [])
  )];

  const handleApplyFilter = () => {
    const filteredCards = Object.values(cards).filter(card => {
      // 담당자 필터
      if (filters.assignee) {
        if (filters.assignee === 'unassigned') {
          if (card.assignees && card.assignees.length > 0) return false;
        } else if (filters.assignee === 'me') {
          // TODO: 현재 사용자 ID 체크
        } else {
          if (!card.assignees || !card.assignees.includes(filters.assignee)) return false;
        }
      }

      // 우선순위 필터
      if (filters.priority && card.priority !== filters.priority) {
        return false;
      }

      // 태그 필터
      if (filters.tags.length > 0) {
        if (!card.tags || !filters.tags.some(tag => card.tags.includes(tag))) {
          return false;
        }
      }

      // 마감일 필터
      if (filters.dueDateRange) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const cardDueDate = card.dueDate ? new Date(card.dueDate) : null;

        switch (filters.dueDateRange) {
          case 'today':
            if (!cardDueDate || cardDueDate.toDateString() !== today.toDateString()) {
              return false;
            }
            break;
          case 'week':
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            if (!cardDueDate || cardDueDate > weekFromNow) {
              return false;
            }
            break;
          case 'overdue':
            if (!cardDueDate || cardDueDate >= today) {
              return false;
            }
            break;
          case 'noduedate':
            if (cardDueDate) {
              return false;
            }
            break;
        }
      }

      // 상태 필터
      if (filters.status && card.status !== filters.status) {
        return false;
      }

      // 검색어 필터
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        if (
          !card.title.toLowerCase().includes(searchLower) &&
          !(card.description && card.description.toLowerCase().includes(searchLower))
        ) {
          return false;
        }
      }

      return true;
    });

    onApplyFilter(filteredCards, filters);
  };

  const handleResetFilter = () => {
    setFilters({
      assignee: '',
      priority: '',
      tags: [],
      dueDateRange: '',
      status: 'active',
      searchText: ''
    });
    onApplyFilter(null, null);
  };

  const toggleTag = (tag) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterHeader}>
        <h3>
          <FontAwesomeIcon icon={faFilter} />
          필터
        </h3>
        <button className={styles.closeBtn} onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className={styles.filterBody}>
        {/* 검색 */}
        <div className={styles.filterSection}>
          <label>
            <FontAwesomeIcon icon={faSearch} />
            검색
          </label>
          <input
            type="text"
            placeholder="제목 또는 설명 검색..."
            value={filters.searchText}
            onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
            className={styles.searchInput}
          />
        </div>

        {/* 담당자 */}
        <div className={styles.filterSection}>
          <label>
            <FontAwesomeIcon icon={faUser} />
            담당자
          </label>
          <select
            value={filters.assignee}
            onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
            className={styles.select}
          >
            <option value="">전체</option>
            <option value="unassigned">할당 안됨</option>
            {members.map(member => (
              <option key={member.uid} value={member.uid}>
                {member.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* 우선순위 */}
        <div className={styles.filterSection}>
          <label>
            <FontAwesomeIcon icon={faFlag} />
            우선순위
          </label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className={styles.select}
          >
            <option value="">전체</option>
            <option value="urgent">긴급</option>
            <option value="high">높음</option>
            <option value="medium">보통</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {/* 마감일 */}
        <div className={styles.filterSection}>
          <label>
            <FontAwesomeIcon icon={faCalendar} />
            마감일
          </label>
          <select
            value={filters.dueDateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dueDateRange: e.target.value }))}
            className={styles.select}
          >
            <option value="">전체</option>
            <option value="today">오늘</option>
            <option value="week">이번 주</option>
            <option value="overdue">기한 지남</option>
            <option value="noduedate">기한 없음</option>
          </select>
        </div>

        {/* 태그 */}
        {allTags.length > 0 && (
          <div className={styles.filterSection}>
            <label>
              <FontAwesomeIcon icon={faTag} />
              태그
            </label>
            <div className={styles.tagList}>
              {allTags.map(tag => (
                <button
                  key={tag}
                  className={`${styles.tagBtn} ${filters.tags.includes(tag) ? styles.active : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 상태 */}
        <div className={styles.filterSection}>
          <label>상태</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="status"
                value="active"
                checked={filters.status === 'active'}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              />
              <span>활성</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="status"
                value="archived"
                checked={filters.status === 'archived'}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              />
              <span>보관됨</span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.filterFooter}>
        <button 
          className={styles.applyBtn}
          onClick={handleApplyFilter}
        >
          필터 적용
        </button>
        <button 
          className={styles.resetBtn}
          onClick={handleResetFilter}
        >
          초기화
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;