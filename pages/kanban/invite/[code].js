import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useRecoilValue } from 'recoil';
import { userState } from '../../../recoil/atoms';
import { read, updateByPath } from '../../../components/common/FirebaseDatabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faUserPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import styles from '../../../styles/InvitePage.module.scss';

const InvitePage = () => {
  const router = useRouter();
  const { code } = router.query;
  const loginUser = useRecoilValue(userState);
  const [invitation, setInvitation] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!code) return;

    // 초대 정보 가져오기
    read(`invitations/${code}`, (inviteData) => {
      if (!inviteData) {
        setError('유효하지 않은 초대 링크입니다.');
        setLoading(false);
        return;
      }

      // 만료 확인
      if (inviteData.expiresAt < Date.now()) {
        setError('만료된 초대 링크입니다.');
        setLoading(false);
        return;
      }

      // 이미 사용된 초대인지 확인
      if (inviteData.status === 'accepted') {
        setError('이미 사용된 초대 링크입니다.');
        setLoading(false);
        return;
      }

      setInvitation(inviteData);

      // 보드 정보 가져오기
      read(`boards/${inviteData.boardId}`, (boardData) => {
        if (!boardData) {
          setError('보드를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
        setBoard(boardData);
        setLoading(false);
      }, { once: true });
    }, { once: true });
  }, [code]);

  useEffect(() => {
    // 게스트이거나 로그인하지 않은 경우 세션에 초대 코드 저장
    if (!loading && !error && code) {
      if (!loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest') {
        sessionStorage.setItem('inviteCode', code);
      }
    }
  }, [loading, loginUser, error, code]);

  const handleJoinBoard = async () => {
    // 게스트 또는 미로그인 사용자는 로그인 페이지로 이동
    if (!loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest') {
      sessionStorage.setItem('inviteCode', code);
      router.push('/login');
      return;
    }
    
    if (!invitation || !board) return;

    // 이미 멤버인지 확인
    if (board.members && board.members[loginUser.uid]) {
      alert('이미 이 보드의 멤버입니다.');
      router.push(`/kanban?boardId=${board.id}`);
      return;
    }

    setJoining(true);

    try {
      // 보드에 멤버 추가
      const memberData = {
        role: invitation.role || 'member',
        displayName: loginUser.displayName || '익명',
        email: loginUser.email,
        photoURL: loginUser.photoURL || null,
        joinedAt: Date.now()
      };

      await updateByPath(`boards/${board.id}/members/${loginUser.uid}`, memberData);

      // 사용자 보드 목록에 추가
      await updateByPath(`users/${loginUser.uid}/boards/${board.id}`, true);

      // 초대 상태 업데이트
      await updateByPath(`invitations/${code}/status`, 'accepted');
      await updateByPath(`invitations/${code}/acceptedBy`, loginUser.uid);
      await updateByPath(`invitations/${code}/acceptedAt`, Date.now());

      // 활동 로그 추가
      const activityId = Date.now().toString();
      await updateByPath(`activities/${board.id}/${activityId}`, {
        id: activityId,
        boardId: board.id,
        type: 'member_joined',
        userId: loginUser.uid,
        userName: loginUser.displayName || '익명',
        description: '초대 링크를 통해 보드에 참여',
        timestamp: Date.now()
      });

      // 보드로 이동
      router.push(`/kanban?boardId=${board.id}`);
    } catch (error) {
      console.error('Error joining board:', error);
      alert('보드 참여 중 오류가 발생했습니다.');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingBox}>
          <FontAwesomeIcon icon={faSpinner} spin className={styles.spinner} />
          <p>초대 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <h2>초대 링크 오류</h2>
          <p>{error}</p>
          <button 
            className={styles.homeBtn}
            onClick={() => router.push('/kanban')}
          >
            칸반보드로 이동
          </button>
        </div>
      </div>
    );
  }

  // 게스트이거나 로그인하지 않은 경우
  if (!loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest') {
    return (
      <div className={styles.container}>
        <div className={styles.loginPrompt}>
          <div className={styles.boardIcon}>
            <FontAwesomeIcon icon={faClipboard} />
          </div>
          <h2>로그인이 필요합니다</h2>
          <p>칸반보드는 회원 전용 서비스입니다.</p>
          <p>보드에 참여하려면 먼저 로그인해주세요.</p>
          
          {board && (
            <div className={styles.boardPreview}>
              <h3>초대받은 보드</h3>
              <div className={styles.boardName}>{`"${board.title}"`}</div>
              <div className={styles.inviterInfo}>
                초대한 사람: {invitation?.invitedBy ? board.members?.[invitation.invitedBy]?.displayName || '알 수 없음' : '알 수 없음'}
              </div>
            </div>
          )}
          
          <button 
            className={styles.loginBtn}
            onClick={() => {
              sessionStorage.setItem('inviteCode', code);
              router.push('/login');
            }}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            로그인하고 참여하기
          </button>
          
          <p className={styles.note}>
            게스트 계정으로는 칸반보드를 이용할 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inviteBox}>
        <div className={styles.boardIcon}>
          <FontAwesomeIcon icon={faClipboard} />
        </div>
        
        <h1>보드 초대</h1>
        
        {board && (
          <>
            <div className={styles.boardInfo}>
              <h2>{board.title}</h2>
              {board.description && (
                <p className={styles.description}>{board.description}</p>
              )}
              <div className={styles.boardStats}>
                <span>멤버 {Object.keys(board.members || {}).length}명</span>
                <span>역할: {invitation.role?.toUpperCase()}</span>
              </div>
            </div>

            <div className={styles.inviter}>
              초대한 사람: {board.members[invitation.invitedBy]?.displayName || '알 수 없음'}
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.joinBtn}
                onClick={handleJoinBoard}
                disabled={joining}
              >
                {joining ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    참여 중...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} />
                    보드 참여하기
                  </>
                )}
              </button>
              
              <button 
                className={styles.cancelBtn}
                onClick={() => router.push('/kanban')}
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;