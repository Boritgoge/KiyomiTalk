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

  // 기본 메뉴 항목
  const baseMenuItems = [
    { path: '/', icon: faHome, label: '홈' },
    { path: '/editor', icon: faEdit, label: '채팅' },
  ];
  
  // 게스트가 아닐 때만 칸반보드 추가
  const menuItems = isGuest 
    ? [...baseMenuItems, { path: '/login', icon: faSignInAlt, label: '로그인' }]
    : [...baseMenuItems, 
       { path: '/kanban', icon: faColumns, label: '칸반보드' },
       { path: '/login', icon: faSignInAlt, label: '로그인' }
      ];

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
        </ul>
      </nav>
      
      {isOpen && <div className={styles.overlay} onClick={toggleMenu} />}
    </>
  );
};

export default LeftNavBar;