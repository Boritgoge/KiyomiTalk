import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFolder, 
  faFolderOpen, 
  faFile, 
  faFileCode,
  faImage,
  faFilePdf,
  faChevronRight,
  faChevronDown,
  faPlus,
  faTrash,
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import { faJs, faPython, faJava, faHtml5, faCss3, faReact } from '@fortawesome/free-brands-svg-icons';
import styles from '../styles/FileExplorer.module.scss';
import { read, write, updateByPath, removeByPath } from './common/FirebaseDatabase';

const FileExplorer = ({ roomId, onFileSelect }) => {
  const [files, setFiles] = useState({});
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreating, setIsCreating] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    if (!roomId) return;
    
    const unsubscribe = read(`rooms/${roomId}/files`, (data) => {
      if (data) {
        setFiles(data);
      } else {
        // 초기 파일 구조 생성
        const initialFiles = {
          src: {
            type: 'folder',
            children: {
              'index.js': { type: 'file', language: 'javascript', content: '// Welcome to KiyomiTalk Editor' },
              'App.js': { type: 'file', language: 'javascript', content: '' },
              components: {
                type: 'folder',
                children: {
                  'Header.js': { type: 'file', language: 'javascript', content: '' },
                  'Footer.js': { type: 'file', language: 'javascript', content: '' }
                }
              }
            }
          },
          'README.md': { type: 'file', language: 'markdown', content: '# Project' },
          'package.json': { type: 'file', language: 'json', content: '{}' }
        };
        updateByPath(`rooms/${roomId}/files`, initialFiles);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const getFileIcon = (item, name) => {
    if (item.type === 'folder') {
      return expandedFolders[name] ? faFolderOpen : faFolder;
    }
    
    const ext = name.split('.').pop().toLowerCase();
    const iconMap = {
      js: faJs,
      jsx: faReact,
      ts: faFileCode,
      tsx: faReact,
      py: faPython,
      java: faJava,
      html: faHtml5,
      css: faCss3,
      scss: faCss3,
      json: faFileCode,
      md: faFile,
      png: faImage,
      jpg: faImage,
      jpeg: faImage,
      gif: faImage,
      pdf: faFilePdf
    };
    
    return iconMap[ext] || faFile;
  };

  const handleFileClick = (path, item) => {
    if (item.type === 'folder') {
      toggleFolder(path);
    } else {
      setSelectedFile(path);
      if (onFileSelect) {
        onFileSelect(path, item);
      }
    }
  };

  const createNewItem = async (parentPath, type) => {
    if (!newItemName.trim()) return;
    
    const path = parentPath ? `${parentPath}/${newItemName}` : newItemName;
    const newItem = type === 'folder' 
      ? { type: 'folder', children: {} }
      : { type: 'file', content: '', language: 'plaintext' };
    
    await updateByPath(`rooms/${roomId}/files/${path.replace(/\//g, '/children/')}`, newItem);
    setIsCreating(null);
    setNewItemName('');
  };

  const deleteItem = async (path) => {
    if (window.confirm(`Delete ${path}?`)) {
      await removeByPath(`rooms/${roomId}/files/${path.replace(/\//g, '/children/')}`);
    }
  };

  const renderTree = (items, parentPath = '') => {
    return Object.entries(items).map(([name, item]) => {
      const currentPath = parentPath ? `${parentPath}/${name}` : name;
      const isFolder = item.type === 'folder';
      const isExpanded = expandedFolders[currentPath];
      
      return (
        <div key={currentPath} className={styles.treeItem}>
          <div 
            className={`${styles.treeNode} ${selectedFile === currentPath ? styles.selected : ''}`}
            onClick={() => handleFileClick(currentPath, item)}
            style={{ paddingLeft: `${(currentPath.split('/').length - 1) * 20 + 10}px` }}
          >
            <span className={styles.icon}>
              {isFolder && (
                <FontAwesomeIcon 
                  icon={isExpanded ? faChevronDown : faChevronRight} 
                  className={styles.chevron}
                />
              )}
              <FontAwesomeIcon icon={getFileIcon(item, name)} />
            </span>
            <span className={styles.name}>{name}</span>
            <span className={styles.actions}>
              {isFolder && (
                <>
                  <FontAwesomeIcon 
                    icon={faPlus} 
                    title="New file"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating({ path: currentPath, type: 'file' });
                    }}
                  />
                  <FontAwesomeIcon 
                    icon={faFolder} 
                    title="New folder"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCreating({ path: currentPath, type: 'folder' });
                    }}
                  />
                </>
              )}
              <FontAwesomeIcon 
                icon={faTrash} 
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(currentPath);
                }}
              />
            </span>
          </div>
          {isFolder && isExpanded && item.children && (
            <div className={styles.treeChildren}>
              {renderTree(item.children, currentPath)}
            </div>
          )}
          {isCreating && isCreating.path === currentPath && (
            <div className={styles.newItemInput} style={{ paddingLeft: `${(currentPath.split('/').length) * 20 + 10}px` }}>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    createNewItem(currentPath, isCreating.type);
                  } else if (e.key === 'Escape') {
                    setIsCreating(null);
                    setNewItemName('');
                  }
                }}
                onBlur={() => {
                  setIsCreating(null);
                  setNewItemName('');
                }}
                placeholder={`New ${isCreating.type} name...`}
                autoFocus
              />
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={styles.fileExplorer}>
      <div className={styles.header}>
        <h3>EXPLORER</h3>
        <div className={styles.actions}>
          <FontAwesomeIcon 
            icon={faPlus} 
            title="New file"
            onClick={() => setIsCreating({ path: '', type: 'file' })}
          />
          <FontAwesomeIcon 
            icon={faFolder} 
            title="New folder"
            onClick={() => setIsCreating({ path: '', type: 'folder' })}
          />
        </div>
      </div>
      <div className={styles.tree}>
        {renderTree(files)}
        {isCreating && isCreating.path === '' && (
          <div className={styles.newItemInput}>
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  createNewItem('', isCreating.type);
                } else if (e.key === 'Escape') {
                  setIsCreating(null);
                  setNewItemName('');
                }
              }}
              onBlur={() => {
                setIsCreating(null);
                setNewItemName('');
              }}
              placeholder={`New ${isCreating.type} name...`}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;