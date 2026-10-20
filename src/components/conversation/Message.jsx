import React from 'react';
import VisualContext from './VisualContext';
import styles from './Message.module.css';

const Message = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.right : styles.left}`}>
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        <div className={styles.header}>
          <span className={`${styles.sender} ${!isUser ? styles.botSender : ''}`}>
            {isUser ? 'YOU' : 'VISIONCAP'}
          </span>
          {message.isDemo && <span className={styles.demoBadge}>DEMO</span>}
          <span className={styles.timestamp}>{message.timestamp}</span>
        </div>
        
        <div className={styles.text}>{message.text}</div>
        
        {!isUser && message.frameId && message.cameraId && (
          <div className={styles.contextWrapper}>
            <VisualContext cameraId={message.cameraId} frameId={message.frameId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
