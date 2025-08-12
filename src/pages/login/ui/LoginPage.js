import React from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { LocalStorage } from '../../../shared/lib/storage/LocalStorage'
import styles from './LoginPage.module.css'
import { FirebaseAuth } from '../../../shared/lib/firebase/FirebaseAuth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { userState } from '../../../entities/user/model'
import { useRecoilState } from 'recoil'

const LoginPage = () => {
  const router = useRouter()
  const [_, setUser] = useRecoilState(userState)
  
  return (
    <div className={styles.container}>
      <Head>
        <title>KiyomiTalk - Login</title>
        <meta name="description" content="KiyomiTalk - Real-time chat application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #007acc, #569cd6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0, 122, 204, 0.3)'
        }}>
          <span style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: 'white'
          }}>K</span>
        </div>
        <h1 className={styles.title}>KiyomiTalk</h1>
        <p className={styles.description}>
          Let&#39;s go <code className={styles.code}>Crazy Katsu!</code>
        </p>
        <div className={styles.login}>
          <a 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              backgroundColor: '#4285f4',
              color: 'white',
              padding: '0.875rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              width: '100%',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              border: '1px solid #4285f4',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#357ae8';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.textDecoration = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4285f4';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.textDecoration = 'none';
            }}
            onClick={async () => {
              const user = await FirebaseAuth.signInWithGoogle()
              LocalStorage.setItem('cachedUser', user)
              setUser(user)
              
              // 로그인 후 리다이렉트 처리
              const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
              const inviteCode = sessionStorage.getItem('inviteCode')
              
              if (inviteCode) {
                sessionStorage.removeItem('inviteCode')
                router.push(`/kanban/invite/${inviteCode}`)
              } else if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin')
                router.push(redirectUrl)
              } else {
                router.push('/')
              }
            }}
          >
            <FontAwesomeIcon 
              icon={faGoogle} 
              width="20" 
              height="20" 
            />
            <span>Google로 로그인</span>
          </a>
          
          <a 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              backgroundColor: '#24292e',
              color: 'white',
              padding: '0.875rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              width: '100%',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              border: '1px solid #24292e',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1e22';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.textDecoration = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#24292e';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.textDecoration = 'none';
            }}
            onClick={async () => {
              const user = await FirebaseAuth.signInWithGithub()
              LocalStorage.setItem('cachedUser', user)
              setUser(user)
              
              // 로그인 후 리다이렉트 처리
              const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
              const inviteCode = sessionStorage.getItem('inviteCode')
              
              if (inviteCode) {
                sessionStorage.removeItem('inviteCode')
                router.push(`/kanban/invite/${inviteCode}`)
              } else if (redirectUrl) {
                sessionStorage.removeItem('redirectAfterLogin')
                router.push(redirectUrl)
              } else {
                router.push('/')
              }
            }}
          >
            <FontAwesomeIcon 
              icon={faGithub} 
              width="20" 
              height="20" 
            />
            <span>GitHub으로 로그인</span>
          </a>
          
          <div style={{
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            margin: '0.5rem 0',
            color: 'var(--vscode-text-muted)',
            fontSize: '0.875rem'
          }}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '1px',
              background: 'var(--vscode-border)'
            }}></div>
            <span style={{
              background: 'var(--vscode-panel)',
              padding: '0 1rem',
              position: 'relative'
            }}>또는</span>
          </div>
          
          <a 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--vscode-sidebar)',
              color: 'var(--vscode-text)',
              padding: '0.875rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              width: '100%',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s',
              border: '1px solid var(--vscode-border)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2a2d2e';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
              e.currentTarget.style.textDecoration = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--vscode-sidebar)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.textDecoration = 'none';
            }}
            onClick={() => {
              // 게스트로 접속
              const guestNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
              const guestUser = {
                uid: 'guest_' + Date.now(),
                email: 'guest@example.com',
                displayName: `게스트${guestNumber}`,
                photoURL: 'https://via.placeholder.com/150/cccccc/666666?text=G',
                providerId: 'guest',
                emailVerified: false
              }
              LocalStorage.setItem('cachedUser', guestUser)
              setUser(guestUser)
              router.push('/')
            }}
          >
            <span style={{
              fontSize: '1.2rem'
            }}>👤</span>
            <span>게스트로 입장</span>
          </a>
        </div>
      </main>
    </div>
  )
}
  
export default LoginPage