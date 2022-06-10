import styles from '../styles/Home.module.scss'
import RoomList from '../components/RoomList'
import Room from '../components/Room'
import { useRecoilValue } from 'recoil'
import { roomIdState } from '../recoil/atoms'

export default function Home() {
  const roomId = useRecoilValue(roomIdState)
  return <>
    <div className={styles.titlebar}>KiyomiTalk</div>
    <div className={styles.container}>
      <div className={styles.channels}></div>
      <header className={styles.rooms}>
        <RoomList/>
      </header>
      <main className={styles.main}>
        {roomId && <Room/>}
      </main>
    </div>
  
  </>
}
