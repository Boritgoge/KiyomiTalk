import React from 'react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faSignInAlt, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import styles from './GuestAccessDenied.module.scss';

const GuestAccessDenied = () => {
  const router = useRouter();

  const handleLogin = () => {
    // 현재 페이지 URL 저장
    const currentPath = router.asPath;
    sessionStorage.setItem('redirectAfterLogin', currentPath);
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <FontAwesomeIcon icon={faLock} />
        </div>
        
        <h1>로그인이 필요한 서비스입니다</h1>
        
        <p className={styles.description}>
          칸반보드는 회원 전용 서비스입니다.<br />
          로그인 후 이용해 주세요.
        </p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📋</span>
            <span>프로젝트 관리</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>👥</span>
            <span>팀 협업</span>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📊</span>
            <span>실시간 동기화</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.loginBtn}
            onClick={handleLogin}
          >
            <FontAwesomeIcon icon={faSignInAlt} />
            로그인하기
          </button>
          
          <button 
            className={styles.registerBtn}
            onClick={handleLogin}
          >
            <FontAwesomeIcon icon={faUserPlus} />
            회원가입
          </button>
        </div>

        <p className={styles.note}>
          게스트 계정으로는 채팅 기능만 이용 가능합니다.
        </p>
      </div>
    </div>
  );
};

export default GuestAccessDenied;