import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import KanbanBoardFirebase from '../../components/kanban/KanbanBoardFirebase';
import BoardSelector from '../../components/kanban/BoardSelector';
import GuestAccessDenied from '../../components/kanban/GuestAccessDenied';
import styles from '../../styles/KanbanPage.module.scss';

const KanbanPage = () => {
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const loginUser = useRecoilValue(userState);
  const router = useRouter();
  const { boardId } = router.query;

  useEffect(() => {
    if (boardId) {
      setSelectedBoardId(boardId);
    }
  }, [boardId]);

  // 게스트 접근 시 리다이렉트는 제거하고 UI로만 처리

  const handleSelectBoard = (boardId) => {
    setSelectedBoardId(boardId);
    router.push(`/kanban?boardId=${boardId}`, undefined, { shallow: true });
  };

  const handleBackToBoards = () => {
    setSelectedBoardId(null);
    router.push('/kanban', undefined, { shallow: true });
  };

  // 게스트이거나 로그인하지 않은 경우 접근 차단 화면 표시
  if (!loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest') {
    return <GuestAccessDenied />;
  }

  return (
    <div className={styles.kanbanPage}>
      {selectedBoardId ? (
        <KanbanBoardFirebase 
          boardId={selectedBoardId} 
          onBack={handleBackToBoards}
        />
      ) : (
        <BoardSelector onSelectBoard={handleSelectBoard} />
      )}
    </div>
  );
};

export default KanbanPage;