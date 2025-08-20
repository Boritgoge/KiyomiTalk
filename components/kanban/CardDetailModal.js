import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,
  faFlag,
  faUser,
  faCalendar,
  faTag,
  faPaperclip,
  faCheckSquare,
  faComment,
  faHistory,
  faEdit,
  faTrash,
  faSave,
  faPlus,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { read, updateByPath, removeByPath } from '../common/FirebaseDatabase';
import { uploadFile, deleteFile, formatFileSize } from '../common/FirebaseStorage';
import { createNotification } from './NotificationSystem';
import styles from './CardDetailModal.module.scss';

const CardDetailModal = ({ card, board, boardId, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  
  // 제목에서 카테고리 추출
  const extractCategoryFromTitle = (titleStr) => {
    const match = titleStr.match(/^\[([^\]]+)\]\s*(.+)/);
    if (match) {
      return { category: match[1], titleWithoutCategory: match[2] };
    }
    return { category: '', titleWithoutCategory: titleStr };
  };
  
  const { category: initialCategory, titleWithoutCategory } = extractCategoryFromTitle(card.title);
  
  const [title, setTitle] = useState(titleWithoutCategory);
  const [category, setCategory] = useState(card.category || initialCategory || '');
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [assignees, setAssignees] = useState(card.assignees || []);
  const [tags, setTags] = useState(card.tags || []);
  const [newTag, setNewTag] = useState('');
  const [checklist, setChecklist] = useState(card.checklist || []);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingChecklistItem, setEditingChecklistItem] = useState(null);
  const [editingChecklistText, setEditingChecklistText] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activities, setActivities] = useState([]);
  const [attachments, setAttachments] = useState(card.attachments || []);
  const [uploadingFile, setUploadingFile] = useState(false);
  const loginUser = useRecoilValue(userState);

  useEffect(() => {
    // 댓글 불러오기
    if (card.comments) {
      const commentsList = Object.entries(card.comments)
        .map(([id, comment]) => ({ id, ...comment }))
        .sort((a, b) => b.createdAt - a.createdAt);
      setComments(commentsList);
    }

    // 활동 로그 불러오기
    read(`activities/${boardId}`, (activitiesData) => {
      if (activitiesData) {
        const cardActivities = Object.values(activitiesData)
          .filter(activity => activity.targetId === card.id)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        setActivities(cardActivities);
      }
    }, { once: true });
  }, [card, boardId]);

  const handleSave = () => {
    const titleWithCategory = category ? `[${category}] ${title}` : title;
    const updatedCard = {
      ...card,
      title: titleWithCategory,
      category,
      description,
      priority,
      dueDate,
      assignees,
      tags,
      checklist,
      updatedAt: Date.now()
    };

    // Firebase 업데이트
    Object.keys(updatedCard).forEach(key => {
      if (key !== 'id' && key !== 'comments') {
        updateByPath(`cards/${boardId}/${card.id}/${key}`, updatedCard[key]);
      }
    });

    // 활동 로그
    const activityId = Date.now().toString();
    updateByPath(`activities/${boardId}/${activityId}`, {
      id: activityId,
      boardId,
      type: 'card_updated',
      userId: loginUser.uid,
      userName: loginUser.displayName || '익명',
      targetId: card.id,
      targetTitle: title,
      description: '카드 수정',
      timestamp: Date.now()
    });

    onUpdate && onUpdate(updatedCard);
    setEditMode(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const commentId = Date.now().toString();
    const comment = {
      text: newComment,
      author: loginUser.uid,
      authorName: loginUser.displayName || '익명',
      createdAt: Date.now()
    };

    updateByPath(`cards/${boardId}/${card.id}/comments/${commentId}`, comment);
    
    setComments([{ id: commentId, ...comment }, ...comments]);
    setNewComment('');

    // 담당자들에게 댓글 알림 생성
    assignees.forEach(userId => {
      if (userId !== loginUser.uid) {
        createNotification(userId, {
          type: 'comment_added',
          boardId,
          cardId: card.id,
          title: '새 댓글이 추가되었습니다',
          description: `"${card.title}" 카드에 댓글이 추가되었습니다`,
          fromUser: loginUser.uid,
          fromUserName: loginUser.displayName || '익명'
        });
      }
    });

    // 활동 로그
    const activityId = Date.now().toString();
    updateByPath(`activities/${boardId}/${activityId}`, {
      id: activityId,
      boardId,
      type: 'comment_added',
      userId: loginUser.uid,
      userName: loginUser.displayName || '익명',
      targetId: card.id,
      targetTitle: card.title,
      description: '댓글 추가',
      timestamp: Date.now()
    });
  };

  const handleDeleteComment = (commentId) => {
    if (confirm('댓글을 삭제하시겠습니까?')) {
      removeByPath(`cards/${boardId}/${card.id}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      text: newChecklistItem,
      completed: false
    };

    const updatedChecklist = [...checklist, newItem];
    setChecklist(updatedChecklist);
    updateByPath(`cards/${boardId}/${card.id}/checklist`, updatedChecklist);
    setNewChecklistItem('');
  };

  const handleToggleChecklistItem = (itemId) => {
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updatedChecklist);
    updateByPath(`cards/${boardId}/${card.id}/checklist`, updatedChecklist);
  };

  const handleDeleteChecklistItem = (itemId) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    setChecklist(updatedChecklist);
    updateByPath(`cards/${boardId}/${card.id}/checklist`, updatedChecklist);
  };

  const handleStartEditChecklistItem = (item) => {
    setEditingChecklistItem(item.id);
    setEditingChecklistText(item.text);
  };

  const handleSaveEditChecklistItem = (itemId) => {
    if (!editingChecklistText.trim()) return;
    
    const updatedChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, text: editingChecklistText } : item
    );
    setChecklist(updatedChecklist);
    updateByPath(`cards/${boardId}/${card.id}/checklist`, updatedChecklist);
    setEditingChecklistItem(null);
    setEditingChecklistText('');
  };

  const handleCancelEditChecklistItem = () => {
    setEditingChecklistItem(null);
    setEditingChecklistText('');
  };

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag)) return;
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleAssignee = (userId) => {
    if (assignees.includes(userId)) {
      setAssignees(assignees.filter(id => id !== userId));
    } else {
      setAssignees([...assignees, userId]);
      
      // 카드 할당 알림 생성
      if (userId !== loginUser.uid) {
        createNotification(userId, {
          type: 'card_assigned',
          boardId,
          cardId: card.id,
          title: '새 카드가 할당되었습니다',
          description: `"${card.title}" 카드가 할당되었습니다`,
          fromUser: loginUser.uid,
          fromUserName: loginUser.displayName || '익명'
        });
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    setUploadingFile(true);

    try {
      const path = `boards/${boardId}/cards/${card.id}/${Date.now()}_${file.name}`;
      const uploadResult = await uploadFile(path, file);
      
      const attachment = {
        id: Date.now().toString(),
        name: file.name,
        url: uploadResult.url,
        path: uploadResult.path,
        size: file.size,
        type: file.type,
        uploadedBy: loginUser.uid,
        uploadedByName: loginUser.displayName || '익명',
        uploadedAt: Date.now()
      };

      const updatedAttachments = [...attachments, attachment];
      setAttachments(updatedAttachments);
      
      // Firebase에 저장
      updateByPath(`cards/${boardId}/${card.id}/attachments`, updatedAttachments);

      // 담당자들에게 파일 첨부 알림 생성
      assignees.forEach(userId => {
        if (userId !== loginUser.uid) {
          createNotification(userId, {
            type: 'attachment_added',
            boardId,
            cardId: card.id,
            title: '파일이 첨부되었습니다',
            description: `"${card.title}" 카드에 ${file.name} 파일이 첨부되었습니다`,
            fromUser: loginUser.uid,
            fromUserName: loginUser.displayName || '익명'
          });
        }
      });

      // 활동 로그
      const activityId = Date.now().toString();
      updateByPath(`activities/${boardId}/${activityId}`, {
        id: activityId,
        boardId,
        type: 'attachment_added',
        userId: loginUser.uid,
        userName: loginUser.displayName || '익명',
        targetId: card.id,
        targetTitle: card.title,
        description: `파일 첨부: ${file.name}`,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploadingFile(false);
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment) => {
    if (!confirm(`${attachment.name} 파일을 삭제하시겠습니까?`)) return;

    try {
      // Storage에서 파일 삭제
      await deleteFile(attachment.path);

      // 목록에서 제거
      const updatedAttachments = attachments.filter(a => a.id !== attachment.id);
      setAttachments(updatedAttachments);

      // Firebase 업데이트
      updateByPath(`cards/${boardId}/${card.id}/attachments`, updatedAttachments);

      // 활동 로그
      const activityId = Date.now().toString();
      updateByPath(`activities/${boardId}/${activityId}`, {
        id: activityId,
        boardId,
        type: 'attachment_removed',
        userId: loginUser.uid,
        userName: loginUser.displayName || '익명',
        targetId: card.id,
        targetTitle: card.title,
        description: `파일 삭제: ${attachment.name}`,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      alert('파일 삭제에 실패했습니다.');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ff6b6b';
      case 'medium': return '#feca57';
      case 'low': return '#48dbfb';
      default: return '#95a5a6';
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '없음';
    }
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const checklistProgress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          {editMode ? (
            <div className={styles.headerEditWrapper}>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className={styles.categorySelect}
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
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.titleInput}
                placeholder="제목을 입력하세요"
                autoFocus
              />
            </div>
          ) : (
            <h2>
              {category && <span className={styles.categoryBadge}>[{category}]</span>}
              {title || card.title}
            </h2>
          )}
          <div className={styles.headerActions}>
            {editMode ? (
              <>
                <button className={styles.saveBtn} onClick={handleSave}>
                  <FontAwesomeIcon icon={faSave} />
                </button>
                <button className={styles.cancelBtn} onClick={() => setEditMode(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </>
            ) : (
              <>
                <button className={styles.editBtn} onClick={() => setEditMode(true)}>
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button className={styles.closeBtn} onClick={onClose}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.mainContent}>
            {/* 메타 정보 */}
            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <FontAwesomeIcon icon={faFlag} />
                {editMode ? (
                  <select 
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
                    className={styles.prioritySelect}
                  >
                    <option value="low">낮음</option>
                    <option value="medium">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                ) : (
                  <span 
                    className={styles.priority}
                    style={{ color: getPriorityColor(priority) }}
                  >
                    {getPriorityLabel(priority)}
                  </span>
                )}
              </div>

              <div className={styles.metaItem}>
                <FontAwesomeIcon icon={faCalendar} />
                {editMode ? (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={styles.dateInput}
                  />
                ) : (
                  <span>{dueDate || '마감일 없음'}</span>
                )}
              </div>
            </div>

            {/* 담당자 */}
            <div className={styles.section}>
              <h3>
                <FontAwesomeIcon icon={faUser} />
                담당자
              </h3>
              {editMode ? (
                <div className={styles.assigneeList}>
                  {Object.entries(board.members || {}).map(([uid, member]) => (
                    <label key={uid} className={styles.assigneeOption}>
                      <input
                        type="checkbox"
                        checked={assignees.includes(uid)}
                        onChange={() => toggleAssignee(uid)}
                      />
                      <span>{member.displayName}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className={styles.assigneeList}>
                  {assignees.length > 0 ? (
                    assignees.map(uid => (
                      <span key={uid} className={styles.assigneeBadge}>
                        {board.members[uid]?.displayName || '알 수 없음'}
                      </span>
                    ))
                  ) : (
                    <span className={styles.noAssignee}>담당자 없음</span>
                  )}
                </div>
              )}
            </div>

            {/* 태그 */}
            <div className={styles.section}>
              <h3>
                <FontAwesomeIcon icon={faTag} />
                태그
              </h3>
              <div className={styles.tagList}>
                {tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    #{tag}
                    {editMode && (
                      <button 
                        className={styles.removeTagBtn}
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
                {editMode && (
                  <div className={styles.addTag}>
                    <input
                      type="text"
                      placeholder="태그 추가..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className={styles.tagInput}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 설명 */}
            <div className={styles.section}>
              <h3>설명</h3>
              {editMode ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={styles.descriptionInput}
                  rows="5"
                  placeholder="설명을 입력하세요..."
                />
              ) : (
                <div className={styles.description}>
                  {description || '설명이 없습니다.'}
                </div>
              )}
            </div>

            {/* 파일 첨부 */}
            <div className={styles.section}>
              <h3>
                <FontAwesomeIcon icon={faPaperclip} />
                첨부파일 ({attachments.length})
              </h3>
              <div className={styles.attachmentList}>
                {attachments.map(attachment => (
                  <div key={attachment.id} className={styles.attachmentItem}>
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={faPaperclip} />
                      <span className={styles.attachmentName}>{attachment.name}</span>
                    </a>
                    <span className={styles.attachmentMeta}>
                      {formatFileSize(attachment.size)} · {attachment.uploadedByName}
                    </span>
                    {attachment.uploadedBy === loginUser.uid && (
                      <button
                        className={styles.deleteAttachmentBtn}
                        onClick={() => handleDeleteAttachment(attachment)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.uploadSection}>
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingFile}
                />
                <label htmlFor="file-upload" className={styles.uploadBtn}>
                  <FontAwesomeIcon icon={faPaperclip} />
                  {uploadingFile ? '업로드 중...' : '파일 첨부'}
                </label>
              </div>
            </div>

            {/* 체크리스트 */}
            <div className={styles.section}>
              <h3>
                <FontAwesomeIcon icon={faCheckSquare} />
                체크리스트 ({completedCount}/{checklist.length})
              </h3>
              {checklist.length > 0 && (
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              )}
              <div className={styles.checklistItems}>
                {checklist.map(item => (
                  <div key={item.id} className={styles.checklistItem}>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggleChecklistItem(item.id)}
                    />
                    {editingChecklistItem === item.id ? (
                      <div className={styles.checklistEditWrapper}>
                        <input
                          type="text"
                          value={editingChecklistText}
                          onChange={(e) => setEditingChecklistText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleSaveEditChecklistItem(item.id);
                            if (e.key === 'Escape') handleCancelEditChecklistItem();
                          }}
                          className={styles.checklistEditInput}
                          autoFocus
                        />
                        <button
                          className={styles.saveChecklistBtn}
                          onClick={() => handleSaveEditChecklistItem(item.id)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button
                          className={styles.cancelChecklistBtn}
                          onClick={handleCancelEditChecklistItem}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className={`${styles.checklistText} ${item.completed ? styles.completed : ''}`}
                          onClick={() => handleStartEditChecklistItem(item)}
                        >
                          {item.text}
                        </span>
                        <div className={styles.checklistActions}>
                          <button
                            className={styles.editItemBtn}
                            onClick={() => handleStartEditChecklistItem(item)}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className={styles.deleteItemBtn}
                            onClick={() => handleDeleteChecklistItem(item.id)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div className={styles.addChecklistItem}>
                  <input
                    type="text"
                    placeholder="새 항목 추가..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    className={styles.checklistInput}
                  />
                  <button onClick={handleAddChecklistItem}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
              </div>
            </div>

            {/* 댓글 */}
            <div className={styles.section}>
              <h3>
                <FontAwesomeIcon icon={faComment} />
                댓글 ({comments.length})
              </h3>
              <div className={styles.commentForm}>
                <textarea
                  placeholder="댓글을 입력하세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className={styles.commentInput}
                  rows="3"
                />
                <button 
                  className={styles.commentBtn}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  댓글 작성
                </button>
              </div>
              <div className={styles.commentList}>
                {comments.map(comment => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentHeader}>
                      <strong>{comment.authorName}</strong>
                      <span className={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                      {comment.author === loginUser.uid && (
                        <button
                          className={styles.deleteCommentBtn}
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                    <p>{comment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 활동 로그 */}
          <div className={styles.sidebar}>
            <h3>
              <FontAwesomeIcon icon={faHistory} />
              활동 로그
            </h3>
            <div className={styles.activityList}>
              {activities.map(activity => (
                <div key={activity.id} className={styles.activity}>
                  <div className={styles.activityUser}>{activity.userName}</div>
                  <div className={styles.activityDesc}>{activity.description}</div>
                  <div className={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className={styles.noActivity}>활동 내역이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal;