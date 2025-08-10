import styles from './HomePage.module.scss'
import { RoomList, Room } from '../../../features/room'
import { Header } from '../../../widgets/header'
import { useRecoilValue } from 'recoil'
import { roomIdState } from '../../../entities/room/model'

export default function HomePage() {
  const roomId = useRecoilValue(roomIdState)
  
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.channels}></div>
        <header className={styles.rooms}>
          <RoomList />
        </header>
        <main className={styles.main}>
          {roomId && <Room />}
        </main>
      </div>
    </>
  )
}