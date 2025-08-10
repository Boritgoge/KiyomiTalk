import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/CollaborativeCursor.module.scss';

const CollaborativeCursor = ({ cursor, editor, colorIndex }) => {
  const [cursorPosition, setCursorPosition] = useState(null);
  const decorationsRef = useRef([]);

  useEffect(() => {
    if (!cursor || !editor) {
      console.log('CollaborativeCursor: Missing cursor or editor', { cursor, editor });
      return;
    }

    const { position, selection, user } = cursor;
    if (!position) {
      console.log('CollaborativeCursor: No position data for user:', user?.displayName);
      return;
    }

    console.log('CollaborativeCursor: Rendering cursor for user:', user?.displayName, 'at position:', position);

    const decorations = [];
    
    // 선택 영역 표시
    if (selection && (
      selection.startLineNumber !== selection.endLineNumber ||
      selection.startColumn !== selection.endColumn
    )) {
      decorations.push({
        range: {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn
        },
        options: {
          className: `remote-selection-${colorIndex}`,
          stickiness: 1
        }
      });
    }
    
    // 커서 위치 표시
    decorations.push({
      range: {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      },
      options: {
        className: `remote-cursor-${colorIndex}`,
        hoverMessage: { value: user?.displayName || '익명' },
        stickiness: 1
      }
    });

    // Monaco Editor의 Decoration API를 사용하여 커서와 선택영역 표시
    const newDecorations = editor.deltaDecorations(
      decorationsRef.current,
      decorations
    );
    
    decorationsRef.current = newDecorations;

    // 화면 좌표 계산 (이름 표시용)
    const updatePosition = () => {
      try {
        const monacoPosition = {
          lineNumber: position.lineNumber,
          column: position.column
        };
        
        // 에디터의 DOM 컨테이너 위치 가져오기
        const editorDomNode = editor.getDomNode();
        if (!editorDomNode) {
          setCursorPosition(null);
          return;
        }
        
        const editorRect = editorDomNode.getBoundingClientRect();
        const coords = editor.getScrolledVisiblePosition(monacoPosition);
        
        if (!coords) {
          setCursorPosition(null);
          return;
        }

        const layoutInfo = editor.getLayoutInfo();
        
        // 실제 화면상 위치 계산 (커서 위치에 정확히)
        const left = editorRect.left + layoutInfo.contentLeft + coords.left;
        const top = editorRect.top + coords.top + coords.height; // 실제 커서 위치는 높이를 더한 곳

        console.log('Cursor position calculated:', { left, top, coords, editorRect });
        setCursorPosition({ left, top });
      } catch (error) {
        console.error('Error calculating cursor position:', error);
        setCursorPosition(null);
      }
    };

    updatePosition();

    const scrollDisposable = editor.onDidScrollChange(updatePosition);
    const layoutDisposable = editor.onDidLayoutChange(updatePosition);

    return () => {
      // 컴포넌트 언마운트시 decoration 제거
      editor.deltaDecorations(decorationsRef.current, []);
      decorationsRef.current = [];
      scrollDisposable.dispose();
      layoutDisposable.dispose();
    };
  }, [cursor?.position?.lineNumber, cursor?.position?.column, cursor?.selection, cursor?.timestamp, editor, colorIndex]);

  if (!cursorPosition || !cursor) return null;

  const { user } = cursor;

  // 커서 위에 이름 표시
  return (
    <div 
      className={`${styles.flagLabel} ${styles[`cursor-user-${colorIndex}`]}`}
      style={{
        position: 'fixed',
        left: `${cursorPosition.left}px`,
        top: `${cursorPosition.top - 20}px`, // 커서 위 20px
      }}
    >
      <span className={styles.name}>{user?.displayName || '익명'}</span>
    </div>
  );
};

export default CollaborativeCursor;