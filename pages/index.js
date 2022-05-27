import styles from '../styles/Home.module.scss'
import RoomList from '../components/RoomList'
import Room from '../components/Room'

export default function Home() {
  return <>
    <div className={styles.container}>
      <header className={styles.header}>
        <RoomList/>
      </header>
      <main className={styles.main}>
        <Room/>
      </main>
    </div>
  
  </>
}
