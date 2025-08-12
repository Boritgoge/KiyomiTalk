import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell,
  faCheck,
  faUserPlus,
  faComment,
  faPaperclip,
  faFlag,
  faCheckCircle,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { read, updateByPath, removeByPath } from '../common/FirebaseDatabase';
import styles from './NotificationSystem.module.scss';

const NotificationSystem = ({ boardId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const loginUser = useRecoilValue(userState);

  useEffect(() => {
    if (!loginUser?.uid) return;

    // 사용자의 알림 구독
    const unsubscribe = read(`users/${loginUser.uid}/notifications`, (notifData) => {
      if (notifData) {
        const notifList = Object.entries(notifData)
          .map(([id, notif]) => ({ id, ...notif }))
          .filter(notif => !boardId || notif.boardId === boardId)
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50); // 최근 50개만
        
        setNotifications(notifList);
        setUnreadCount(notifList.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [loginUser, boardId]);

  const markAsRead = (notificationId) => {
    updateByPath(`users/${loginUser.uid}/notifications/${notificationId}/read`, true);
  };

  const markAllAsRead = () => {
    notifications.forEach(notif => {
      if (!notif.read) {
        updateByPath(`users/${loginUser.uid}/notifications/${notif.id}/read`, true);
      }
    });
  };

  const deleteNotification = (notificationId) => {
    removeByPath(`users/${loginUser.uid}/notifications/${notificationId}`);
  };

  const clearAllNotifications = () => {
    if (confirm('모든 알림을 삭제하시겠습니까?')) {
      removeByPath(`users/${loginUser.uid}/notifications`);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'card_assigned': return faUserPlus;
      case 'comment_added': return faComment;
      case 'attachment_added': return faPaperclip;
      case 'card_moved': return faFlag;
      case 'member_added': return faUserPlus;
      default: return faBell;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'card_assigned': return '#667eea';
      case 'comment_added': return '#4ecdc4';
      case 'attachment_added': return '#45b7d1';
      case 'card_moved': return '#feca57';
      case 'member_added': return '#96ceb4';
      default: return '#95a5a6';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={styles.notificationContainer}>
      <button 
        className={styles.notificationBtn}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <FontAwesomeIcon icon={faBell} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showNotifications && (
        <>
          <div className={styles.overlay} onClick={() => setShowNotifications(false)} />
          <div className={styles.notificationPanel}>
            <div className={styles.panelHeader}>
              <h3>알림</h3>
              <div className={styles.headerActions}>
                {unreadCount > 0 && (
                  <button 
                    className={styles.markAllBtn}
                    onClick={markAllAsRead}
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    모두 읽음
                  </button>
                )}
                <button 
                  className={styles.clearBtn}
                  onClick={clearAllNotifications}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  모두 삭제
                </button>
              </div>
            </div>

            <div className={styles.notificationList}>
              {notifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <FontAwesomeIcon icon={faBell} />
                  <p>새로운 알림이 없습니다</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div 
                      className={styles.iconWrapper}
                      style={{ backgroundColor: getNotificationColor(notif.type) }}
                    >
                      <FontAwesomeIcon icon={getNotificationIcon(notif.type)} />
                    </div>
                    <div className={styles.content}>
                      <div className={styles.title}>{notif.title}</div>
                      <div className={styles.description}>{notif.description}</div>
                      <div className={styles.time}>{getTimeAgo(notif.timestamp)}</div>
                    </div>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSystem;

// 알림 생성 유틸리티 함수
export const createNotification = (userId, notification) => {
  const notifId = Date.now().toString();
  updateByPath(`users/${userId}/notifications/${notifId}`, {
    id: notifId,
    ...notification,
    read: false,
    timestamp: Date.now()
  });
};