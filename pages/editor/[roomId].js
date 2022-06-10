import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import db, { read, updateByPath } from '/components/common/FirebaseDatabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faJs, faJava, faPython } from "@fortawesome/free-brands-svg-icons"
import { faDatabase } from "@fortawesome/free-solid-svg-icons"
import styles from '../../styles/Editor.module.scss'
const MonacoEditorWithNoSSR = dynamic( 
    async () => import('@monaco-editor/react'),
    { ssr: false }
)
export const getServerSideProps = async (context) => {
    const { query } = context;
    const { roomId } = query;
    return {
        props: {
            roomId,
        },
    };
};
export default function Editor() {
    const [language, setLanguage] = useState('javascript')
    const [playground, setPlayground] = useState('')
    const router = useRouter()
    const { roomId } = router.query
    useEffect(() => {
        const unsubscribe = read(`rooms/${roomId}`, (data) => {
            const { key, locked, members, playground } = data || {};
            if(roomId !== key) return;
            // setLocked(locked)
            // setMembers(members)      
            if(locked && !members[loginUser.uid]) return;
            setPlayground(playground)
            
        })
        return () => {
            unsubscribe()
        }
    }, [db])
    return <>
        <header className={styles.language_group}>
            <FontAwesomeIcon className={language === 'javascript' ? 'selected' : ''} icon={faJs} onClick={()=>{setLanguage('javascript')}}/>
            <FontAwesomeIcon className={language === 'java' ? 'selected' : ''} icon={faJava} onClick={()=>{setLanguage('java')}}/>
            <FontAwesomeIcon className={language === 'python' ? 'selected' : ''} icon={faPython} onClick={()=>{setLanguage('python')}}/>
            <FontAwesomeIcon className={language === 'sql' ? 'selected' : ''} icon={faDatabase} onClick={()=>{setLanguage('sql')}}/>
        </header>
        <MonacoEditorWithNoSSR
            theme="vs-dark"
            height="100vh"
            value={playground}
            language={language}
            onChange={(newValue, { changes }) => {
                const [{ rangeLength, rangeOffset, text }] = changes;
                if(rangeOffset === 0 && rangeLength === text.length) {
                    return;
                }
                updateByPath(`rooms/${roomId}/playground`, newValue)
            }}
        />
    </>
}
