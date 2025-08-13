import React from 'react';
import { useRouter } from 'next/router';
import { useRecoilValue } from 'recoil';
import { userState } from '../src/entities/user/model';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faComments, 
  faColumns, 
  faUsers,
  faCode,
  faTerminal,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import styles from '../styles/LandingPage.module.scss';

export default function Home() {
  const router = useRouter();
  const loginUser = useRecoilValue(userState);
  const isGuest = !loginUser || loginUser.providerId === 'mock' || loginUser.providerId === 'guest';

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.codeEditor}>
          <div className={styles.editorHeader}>
            <div className={styles.tabs}>
              <div className={styles.tab}>
                <FontAwesomeIcon icon={faCode} />
                <span>KiyomiTalk.tsx</span>
              </div>
            </div>
          </div>
          <div className={styles.editorContent}>
            <div className={styles.lineNumbers}>
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
              <span>6</span>
              <span>7</span>
            </div>
            <div className={styles.code}>
              <div className={styles.codeLine}>
                <span className={styles.keyword}>const</span> 
                <span className={styles.variable}> KiyomiTalk</span> 
                <span className={styles.operator}> = </span>
                <span className={styles.punctuation}>{'{'}</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.property}>  name:</span> 
                <span className={styles.string}> {'"실시간 협업 플랫폼"'}</span>
                <span className={styles.punctuation}>,</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.property}>  features:</span> 
                <span className={styles.punctuation}> [</span>
                <span className={styles.string}>{`"채팅"`}</span>
                <span className={styles.punctuation}>, </span>
                <span className={styles.string}>{`"칸반보드"`}</span>
                <span className={styles.punctuation}>],</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.property}>  theme:</span> 
                <span className={styles.string}> {`"VSCode Dark"`}</span>
                <span className={styles.punctuation}>,</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.property}>  status:</span> 
                <span className={styles.string}> {`"Ready to collaborate"`}</span>
              </div>
              <div className={styles.codeLine}>
                <span className={styles.punctuation}>{'}'}</span>
                <span className={styles.punctuation}>;</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <FontAwesomeIcon icon={faTerminal} className={styles.terminal} />
            KiyomiTalk
          </h1>
          <p className={styles.subtitle}>
            VSCode 스타일의 협업 플랫폼
          </p>
          <p className={styles.description}>
            개발자를 위한 채팅과 칸반보드.<br />
            익숙한 다크 테마로 편안한 작업 환경을 제공합니다.
          </p>
          <div className={styles.ctaButtons}>
            {isGuest ? (
              <>
                <button 
                  className={styles.primaryBtn}
                  onClick={() => router.push('/login')}
                >
                  <FontAwesomeIcon icon={faCode} />
                  시작하기
                </button>
                <button 
                  className={styles.secondaryBtn}
                  onClick={() => router.push('/editor')}
                >
                  <FontAwesomeIcon icon={faComments} />
                  게스트로 채팅
                </button>
              </>
            ) : (
              <>
                <button 
                  className={styles.primaryBtn}
                  onClick={() => router.push('/kanban')}
                >
                  <FontAwesomeIcon icon={faColumns} />
                  칸반보드
                </button>
                <button 
                  className={styles.secondaryBtn}
                  onClick={() => router.push('/editor')}
                >
                  <FontAwesomeIcon icon={faComments} />
                  채팅방
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FontAwesomeIcon icon={faComments} />
            </div>
            <h3>실시간 채팅</h3>
            <p>코드 공유와 파일 전송이 가능한 채팅방</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FontAwesomeIcon icon={faColumns} />
            </div>
            <h3>칸반보드</h3>
            <p>드래그 앤 드롭으로 작업 관리</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <h3>팀 협업</h3>
            <p>초대 링크로 간편한 팀원 관리</p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className={styles.quickStart}>
        <h2 className={styles.sectionTitle}>{`// Quick Start`}</h2>
        <div className={styles.commandBox}>
          <div className={styles.command}>
            <span className={styles.prompt}>$</span>
            <span className={styles.text}>로그인 → 보드 생성 → 팀 초대</span>
          </div>
        </div>
        <div className={styles.accessInfo}>
          <div className={styles.accessCard}>
            <h3>게스트</h3>
            <ul>
              <li>✓ 채팅 기능</li>
              <li>✗ 칸반보드</li>
            </ul>
          </div>
          <div className={styles.accessCard}>
            <h3>회원</h3>
            <ul>
              <li>✓ 모든 기능</li>
              <li>✓ 무제한 이용</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2024 KiyomiTalk - VSCode Dark Theme Inspired</p>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <FontAwesomeIcon icon={faGithub} />
          </a>
        </div>
      </footer>
    </div>
  );
}