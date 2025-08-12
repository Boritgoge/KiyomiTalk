import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers,
  faUserPlus,
  faCrown,
  faUserShield,
  faUser,
  faEye,
  faTrash,
  faCopy,
  faCheck,
  faTimes,
  faEnvelope,
  faLink
} from '@fortawesome/free-solid-svg-icons';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { read, updateByPath, removeByPath } from '../common/FirebaseDatabase';
import { createNotification } from './NotificationSystem';
import styles from './MemberManagement.module.scss';

const MemberManagement = ({ boardId, board, onClose }) => {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const loginUser = useRecoilValue(userState);

  useEffect(() => {
    if (!board) return;
    
    // 멤버 목록 정렬 (Owner > Admin > Member > Viewer)
    const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
    const sortedMembers = Object.entries(board.members || {})
      .map(([uid, member]) => ({ uid, ...member }))
      .sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
    
    setMembers(sortedMembers);
    
    // 초대 링크 생성
    generateInviteLink();
  }, [board]);

  const generateInviteLink = () => {
    const inviteCode = btoa(`${boardId}-${Date.now()}`).slice(0, 8);
    const link = `${window.location.origin}/kanban/invite/${inviteCode}`;
    setInviteLink(link);
    
    // Firebase에 초대 코드 저장
    updateByPath(`invitations/${inviteCode}`, {
      boardId,
      invitedBy: loginUser.uid,
      role: 'member',
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7일 후 만료
      createdAt: Date.now(),
      status: 'pending'
    });
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    // 이미 멤버인지 확인
    const existingMember = members.find(m => m.email === inviteEmail);
    if (existingMember) {
      alert('이미 보드 멤버입니다.');
      return;
    }

    // 초대 생성
    const inviteCode = btoa(`${boardId}-${inviteEmail}-${Date.now()}`).slice(0, 12);
    updateByPath(`invitations/${inviteCode}`, {
      boardId,
      invitedBy: loginUser.uid,
      email: inviteEmail,
      role: inviteRole,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7일 후 만료
      createdAt: Date.now(),
      status: 'pending'
    });

    // 사용자가 존재하면 알림 생성
    const userSnapshot = await read(`users`, null, { once: true });
    if (userSnapshot) {
      const targetUser = Object.entries(userSnapshot).find(([uid, user]) => user.email === inviteEmail);
      if (targetUser) {
        createNotification(targetUser[0], {
          type: 'member_added',
          boardId,
          title: '보드 초대를 받았습니다',
          description: `"${board.title}" 보드에 초대되었습니다`,
          fromUser: loginUser.uid,
          fromUserName: loginUser.displayName || '익명'
        });
      }
    }
    
    // TODO: 실제로는 이메일 발송 로직 필요
    alert(`${inviteEmail}로 초대를 보냈습니다.\n초대 링크: ${window.location.origin}/kanban/invite/${inviteCode}`);
    
    setInviteEmail('');
  };

  const handleRoleChange = (memberUid, newRole) => {
    if (memberUid === loginUser.uid) {
      alert('자신의 권한은 변경할 수 없습니다.');
      return;
    }

    const member = members.find(m => m.uid === memberUid);
    if (member.role === 'owner') {
      alert('소유자 권한은 변경할 수 없습니다.');
      return;
    }

    updateByPath(`boards/${boardId}/members/${memberUid}/role`, newRole);
    
    // 활동 로그
    const activityId = Date.now().toString();
    updateByPath(`activities/${boardId}/${activityId}`, {
      id: activityId,
      boardId,
      type: 'member_role_changed',
      userId: loginUser.uid,
      userName: loginUser.displayName || '익명',
      targetId: memberUid,
      description: `멤버 권한을 ${newRole}로 변경`,
      timestamp: Date.now()
    });
  };

  const handleRemoveMember = (memberUid) => {
    if (memberUid === loginUser.uid) {
      alert('자신은 제거할 수 없습니다. 보드를 나가려면 "보드 나가기"를 사용하세요.');
      return;
    }

    const member = members.find(m => m.uid === memberUid);
    if (member.role === 'owner') {
      alert('소유자는 제거할 수 없습니다.');
      return;
    }

    if (confirm(`${member.displayName}님을 보드에서 제거하시겠습니까?`)) {
      removeByPath(`boards/${boardId}/members/${memberUid}`);
      removeByPath(`users/${memberUid}/boards/${boardId}`);
      
      // 활동 로그
      const activityId = Date.now().toString();
      updateByPath(`activities/${boardId}/${activityId}`, {
        id: activityId,
        boardId,
        type: 'member_removed',
        userId: loginUser.uid,
        userName: loginUser.displayName || '익명',
        targetId: memberUid,
        targetTitle: member.displayName,
        description: `멤버 제거`,
        timestamp: Date.now()
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return faCrown;
      case 'admin': return faUserShield;
      case 'member': return faUser;
      case 'viewer': return faEye;
      default: return faUser;
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return '소유자';
      case 'admin': return '관리자';
      case 'member': return '멤버';
      case 'viewer': return '열람자';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return '#ffd700';
      case 'admin': return '#667eea';
      case 'member': return '#4ecdc4';
      case 'viewer': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const currentUserRole = board?.members?.[loginUser?.uid]?.role;
  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin';

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            <FontAwesomeIcon icon={faUsers} />
            보드 멤버 관리
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'members' ? styles.active : ''}`}
            onClick={() => setActiveTab('members')}
          >
            현재 멤버 ({members.length})
          </button>
          {canManageMembers && (
            <button 
              className={`${styles.tab} ${activeTab === 'invite' ? styles.active : ''}`}
              onClick={() => setActiveTab('invite')}
            >
              멤버 초대
            </button>
          )}
        </div>

        {activeTab === 'members' && (
          <div className={styles.membersList}>
            {members.map(member => (
              <div key={member.uid} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  {member.photoURL ? (
                    <img src={member.photoURL} alt={member.displayName} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {member.displayName?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <div className={styles.memberName}>
                      {member.displayName || '익명'}
                      {member.uid === loginUser.uid && ' (나)'}
                    </div>
                    <div className={styles.memberEmail}>{member.email}</div>
                  </div>
                </div>
                
                <div className={styles.memberActions}>
                  <div 
                    className={styles.roleTag}
                    style={{ backgroundColor: getRoleColor(member.role) }}
                  >
                    <FontAwesomeIcon icon={getRoleIcon(member.role)} />
                    {getRoleLabel(member.role)}
                  </div>
                  
                  {canManageMembers && member.uid !== loginUser.uid && member.role !== 'owner' && (
                    <>
                      <select 
                        className={styles.roleSelect}
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.uid, e.target.value)}
                      >
                        <option value="admin">관리자</option>
                        <option value="member">멤버</option>
                        <option value="viewer">열람자</option>
                      </select>
                      
                      <button 
                        className={styles.removeBtn}
                        onClick={() => handleRemoveMember(member.uid)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'invite' && canManageMembers && (
          <div className={styles.inviteSection}>
            <div className={styles.inviteByEmail}>
              <h3>
                <FontAwesomeIcon icon={faEnvelope} />
                이메일로 초대
              </h3>
              <div className={styles.inviteForm}>
                <input
                  type="email"
                  placeholder="이메일 주소 입력..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={styles.emailInput}
                />
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value)}
                  className={styles.roleSelect}
                >
                  <option value="member">멤버</option>
                  <option value="viewer">열람자</option>
                  {currentUserRole === 'owner' && (
                    <option value="admin">관리자</option>
                  )}
                </select>
                <button 
                  className={styles.inviteBtn}
                  onClick={handleInviteByEmail}
                >
                  초대 보내기
                </button>
              </div>
            </div>

            <div className={styles.inviteByLink}>
              <h3>
                <FontAwesomeIcon icon={faLink} />
                초대 링크
              </h3>
              <div className={styles.linkContainer}>
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className={styles.linkInput}
                />
                <button 
                  className={styles.copyBtn}
                  onClick={handleCopyLink}
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                  {copied ? '복사됨' : '복사'}
                </button>
              </div>
              <button 
                className={styles.regenerateBtn}
                onClick={generateInviteLink}
              >
                새 링크 생성
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberManagement;