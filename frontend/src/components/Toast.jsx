import React, { useEffect, useState } from 'react';
import { usePlayer } from '../context/PlayerContext';

const iconMap = {
  success: '✓',
  info: 'ℹ',
  error: '✕',
  download: '⬇',
  like: '♥',
};

const Toast = () => {
  const { toast } = usePlayer();
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(null);

  useEffect(() => {
    if (toast) {
      setDisplayed(toast);
      setVisible(true);
    } else {
      setVisible(false);
      const t = setTimeout(() => setDisplayed(null), 400);
      return () => clearTimeout(t);
    }
  }, [toast]);

  if (!displayed) return null;

  return (
    <div className={`toast-wrapper ${visible ? 'toast-in' : 'toast-out'}`}>
      <div className={`toast-card toast-${displayed.type}`}>
        <div className="toast-accent-bar" />
        <div className="toast-icon-wrap">
          {displayed.icon || iconMap[displayed.type] || '✓'}
        </div>
        <span className="toast-msg">{displayed.message}</span>
      </div>
    </div>
  );
};

export default Toast;
