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
    const [language, setLanguage] = useState('')
    const [code, setCode] = useState('')
    const router = useRouter()
    const { roomId } = router.query
    useEffect(() => {
        const unsubscribe = read(`rooms/${roomId}`, (data) => {
            const { key, locked, members, playground } = data || {};
            if(roomId !== key) return;
            // setLocked(locked)
            // setMembers(members)      
            if(locked && !members[loginUser.uid]) return;
            const { code, language } = playground || {};
            setCode(code)
            setLanguage(language)
            
        })
        return () => {
            unsubscribe()
        }
    }, [db])

    const setEditorLanguage = (language) => {
        setLanguage(language)
        updateByPath(`rooms/${roomId}/playground/language`, language)
    }
    return <>
        <div className={styles.container}>
            <header className={styles.language_group}>
                <FontAwesomeIcon className={language === 'javascript' ? 'selected' : ''} icon={faJs} onClick={()=>{setEditorLanguage('javascript')}}/>
                <FontAwesomeIcon className={language === 'java' ? 'selected' : ''} icon={faJava} onClick={()=>{setEditorLanguage('java')}}/>
                <FontAwesomeIcon className={language === 'python' ? 'selected' : ''} icon={faPython} onClick={()=>{setEditorLanguage('python')}}/>
                <FontAwesomeIcon className={language === 'sql' ? 'selected' : ''} icon={faDatabase} onClick={()=>{setEditorLanguage('sql')}}/>
            </header>
            <MonacoEditorWithNoSSR
                theme="vs-dark"
                height="100vh"
                value={code}
                language={language}
                onChange={(newValue, { changes }) => {
                    const [{ rangeLength, rangeOffset, text }] = changes;
                    if(rangeOffset === 0 && rangeLength === text.length) {
                        return;
                    }
                    updateByPath(`rooms/${roomId}/playground/code`, newValue)
                }}
            />

        </div>
    </>
}
