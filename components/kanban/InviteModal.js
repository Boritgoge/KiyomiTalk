import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,
  faLink,
  faCopy,
  faCheck,
  faEnvelope,
  faUserPlus
} from '@fortawesome/free-solid-svg-icons';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { updateByPath } from '../common/FirebaseDatabase';
import styles from './InviteModal.module.scss';

const InviteModal = ({ boardId, board, onClose }) => {
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const loginUser = useRecoilValue(userState);

  useEffect(() => {
    // 초대 링크 생성
    const inviteCode = btoa(`${boardId}-${Date.now()}`).slice(0, 12);
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
  }, [boardId, loginUser.uid]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailInvite = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      alert('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    // 이메일 초대 코드 생성
    const emailInviteCode = btoa(`${boardId}-${inviteEmail}-${Date.now()}`).slice(0, 12);
    const emailLink = `${window.location.origin}/kanban/invite/${emailInviteCode}`;
    
    updateByPath(`invitations/${emailInviteCode}`, {
      boardId,
      invitedBy: loginUser.uid,
      email: inviteEmail,
      role: inviteRole,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
      createdAt: Date.now(),
      status: 'pending'
    });

    // 실제로는 이메일 발송 API 호출이 필요
    alert(`${inviteEmail}로 초대 링크가 전송되었습니다.\n(개발 중: ${emailLink})`);
    setInviteEmail('');
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            <FontAwesomeIcon icon={faUserPlus} />
            보드 멤버 초대
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 초대 링크 섹션 */}
          <div className={styles.section}>
            <h3>
              <FontAwesomeIcon icon={faLink} />
              초대 링크
            </h3>
            <p className={styles.description}>
              이 링크를 공유하여 멤버를 초대할 수 있습니다. (7일간 유효)
            </p>
            <div className={styles.linkBox}>
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
                {copied ? '복사됨!' : '복사'}
              </button>
            </div>
          </div>

          {/* 이메일 초대 섹션 */}
          <div className={styles.section}>
            <h3>
              <FontAwesomeIcon icon={faEnvelope} />
              이메일로 초대
            </h3>
            <div className={styles.emailForm}>
              <input
                type="email"
                placeholder="이메일 주소를 입력하세요"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={styles.emailInput}
              />
              <select 
                value={inviteRole} 
                onChange={(e) => setInviteRole(e.target.value)}
                className={styles.roleSelect}
              >
                <option value="viewer">열람자</option>
                <option value="member">멤버</option>
                <option value="admin">관리자</option>
              </select>
              <button 
                className={styles.inviteBtn}
                onClick={handleEmailInvite}
              >
                초대 보내기
              </button>
            </div>
          </div>

          {/* 현재 멤버 목록 */}
          <div className={styles.section}>
            <h3>현재 멤버 ({Object.keys(board.members || {}).length}명)</h3>
            <div className={styles.memberList}>
              {Object.entries(board.members || {}).map(([uid, member]) => (
                <div key={uid} className={styles.memberItem}>
                  <span className={styles.memberName}>
                    {member.displayName || '익명'}
                  </span>
                  <span className={styles.memberRole}>
                    {member.role === 'owner' ? '소유자' :
                     member.role === 'admin' ? '관리자' :
                     member.role === 'member' ? '멤버' : '열람자'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteModal;