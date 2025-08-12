import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRecoilValue } from 'recoil';
import { userState } from '../../recoil/atoms';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faEdit, 
  faColumns,
  faSignInAlt,
  faSignOutAlt,
  faUser,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import styles from './LeftNavBar.module.scss';

const LeftNavBar = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const isEditorPage = router.pathname.includes('/editor');
  const loginUser = useRecoilValue(userState);
  
  // 게스트 여부 확인
  const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';

  // 로그아웃 처리 함수
  const handleLogout = () => {
    // localStorage에서 사용자 정보 삭제
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cachedUser');
      window.location.href = '/login';
    }
  };

  // 기본 메뉴 항목
  const baseMenuItems = [
    { path: '/', icon: faHome, label: '홈' },
    { path: '/editor', icon: faEdit, label: '채팅' },
  ];
  
  // 로그인 상태에 따라 메뉴 구성
  let menuItems = [...baseMenuItems];
  
  if (isGuest) {
    // 게스트일 때: 로그인 메뉴만
    menuItems.push({ path: '/login', icon: faSignInAlt, label: '로그인' });
  } else {
    // 로그인했을 때: 칸반보드 추가, 로그인 메뉴 제거
    menuItems.push({ path: '/kanban', icon: faColumns, label: '칸반보드' });
  }

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className={styles.menuToggle} onClick={toggleMenu}>
        <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
      </button>
      
      <nav className={`${styles.leftNav} ${isOpen ? styles.open : ''} ${isEditorPage ? styles.withTitlebar : ''}`}>
        <ul className={styles.navList}>
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <a 
                  className={`${styles.navItem} ${
                    router.pathname === item.path ? styles.active : ''
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <FontAwesomeIcon icon={item.icon} className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
          
          {/* 로그인 상태일 때 사용자 정보와 로그아웃 */}
          {!isGuest && (
            <>
              <li className={styles.divider}></li>
              <li className={styles.userInfo}>
                <div className={styles.navItem}>
                  <FontAwesomeIcon icon={faUser} className={styles.icon} />
                  <span className={styles.label}>
                    {loginUser?.displayName || loginUser?.email || '사용자'}
                  </span>
                </div>
              </li>
              <li>
                <a 
                  className={styles.navItem}
                  onClick={handleLogout}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className={styles.icon} />
                  <span className={styles.label}>로그아웃</span>
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>
      
      {isOpen && <div className={styles.overlay} onClick={toggleMenu} />}
    </>
  );
};

export default LeftNavBar;