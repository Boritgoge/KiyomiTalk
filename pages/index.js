import styles from '../styles/Home.module.scss'
import { useRecoilValue, useRecoilState } from 'recoil'
import { roomIdState } from '../recoil/atoms'
import { userState } from '../src/entities/user/model'
import RoomList from '../components/RoomList'
import Room from '../components/Room'
import { useRouter } from 'next/router'
import { FirebaseAuth } from '../src/shared/lib/firebase/FirebaseAuth'
import { customConfirm } from '../components/common/Modal'

export default function Home() {
  const roomId = useRecoilValue(roomIdState)
  const [user, setUser] = useRecoilState(userState)
  const router = useRouter()
  
  const handleLogout = async () => {
    console.log('로그아웃 버튼 클릭됨')
    try {
      const confirmed = await customConfirm('로그아웃 하시겠습니까?', {
        title: '로그아웃',
        confirmText: '로그아웃',
        cancelText: '취소'
      })
      
      if (confirmed) {
        console.log('로그아웃 확인됨')
        await FirebaseAuth.signOut()
        setUser(null)
        router.push('/login')
      }
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
  }
  
  return (
    <div className={styles.container}>
      <header className={styles.titlebar}>
        <span>KiyomiTalk</span>
        <div className={styles.headerRight}>
          {user && (
            <>
              <span className={styles.userName}>
                {user.displayName || user.email}
              </span>
              <button 
                onClick={handleLogout}
                className={styles.logoutBtn}
                title="로그아웃"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </>
          )}
        </div>
      </header>
      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <RoomList />
        </aside>
        <section className={styles.content}>
          {roomId && <Room />}
        </section>
      </div>
    </div>
  )
}
