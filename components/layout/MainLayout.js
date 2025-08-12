import React from 'react';
import { useRouter } from 'next/router';
import LeftNavBar from './LeftNavBar';
import styles from './MainLayout.module.scss';

const MainLayout = ({ children }) => {
  const router = useRouter();
  const isEditorPage = router.pathname.includes('/editor');

  return (
    <div className={styles.layoutContainer}>
      {isEditorPage && (
        <header className={styles.globalTitlebar}>KiyomiTalk</header>
      )}
      <div className={`${styles.contentWrapper} ${isEditorPage ? styles.withTitlebar : ''}`}>
        <LeftNavBar />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;