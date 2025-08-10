import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styles from '../../styles/Modal.module.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

let modalRoot;
if (typeof window !== 'undefined') {
  modalRoot = document.getElementById('modal-root') || document.body;
}

// Modal Provider Context
const ModalContext = React.createContext();

export const useModal = () => {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);
  const [confirms, setConfirms] = useState([]);

  const showAlert = (message, options = {}) => {
    const id = Date.now();
    setAlerts(prev => [...prev, { id, message, ...options }]);
    return id;
  };

  const showConfirm = (message, options = {}) => {
    return new Promise((resolve) => {
      const id = Date.now();
      setConfirms(prev => [...prev, { 
        id, 
        message, 
        ...options,
        onConfirm: () => {
          setConfirms(prev => prev.filter(c => c.id !== id));
          resolve(true);
        },
        onCancel: () => {
          setConfirms(prev => prev.filter(c => c.id !== id));
          resolve(false);
        }
      }]);
    });
  };

  const closeAlert = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {alerts.map(alert => (
        <AlertModal 
          key={alert.id} 
          {...alert} 
          onClose={() => closeAlert(alert.id)} 
        />
      ))}
      {confirms.map(confirm => (
        <ConfirmModal 
          key={confirm.id} 
          {...confirm} 
        />
      ))}
    </ModalContext.Provider>
  );
};

// Alert Modal Component
const AlertModal = ({ message, title = '알림', onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <FontAwesomeIcon 
            icon={faTimes} 
            className={styles.closeBtn}
            onClick={onClose}
          />
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={styles.primaryBtn}
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

// Confirm Modal Component
const ConfirmModal = ({ message, title = '확인', onConfirm, onCancel, confirmText = '확인', cancelText = '취소' }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onCancel]);

  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <FontAwesomeIcon 
            icon={faTimes} 
            className={styles.closeBtn}
            onClick={onCancel}
          />
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={styles.primaryBtn}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
};

// Standalone functions for global use
let globalShowAlert = null;
let globalShowConfirm = null;

export const setGlobalModal = (showAlert, showConfirm) => {
  console.log('setGlobalModal called with:', showAlert, showConfirm);
  globalShowAlert = showAlert;
  globalShowConfirm = showConfirm;
};

export const customAlert = (message, options) => {
  if (globalShowAlert) {
    return globalShowAlert(message, options);
  }
  console.warn('Modal provider not initialized');
};

export const customConfirm = async (message, options) => {
  console.log('customConfirm called:', message, options);
  console.log('globalShowConfirm:', globalShowConfirm);
  
  if (globalShowConfirm) {
    return await globalShowConfirm(message, options);
  }
  console.warn('Modal provider not initialized, falling back to window.confirm');
  return window.confirm(message);
};