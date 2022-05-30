import styles from '../styles/Home.module.scss'
import RoomList from '../components/RoomList'
import Room from '../components/Room'

export default function Home() {
  return <>
    <div className={styles.titlebar}>KiyomiTalk</div>
    <div className={styles.container}>
      <div className={styles.channels}></div>
      <header className={styles.rooms}>
        <RoomList/>
      </header>
      <main className={styles.main}>
        <Room/>
      </main>
    </div>
  
  </>
}
