import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import db, { read, updateByPath } from '/components/common/FirebaseDatabase'
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
    <MonacoEditorWithNoSSR
        theme="vs-dark"
        height="100vh"
        value={playground}
        defaultLanguage="javascript"
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
