import { useState } from 'react';
import { progressStore } from '../../store';

export function ResetProgress() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState('');

  function resetProgress() {
    progressStore.reset();
    setConfirming(false);
    setMessage('進度已重設。');
  }

  return (
    <section className="settings-card">
      <h2>重新開始</h2>
      <p>清除全部課程的 XP、皇冠與複習紀錄。</p>
      {confirming ? (
        <div className="confirm-box">
          <p>確定清除全部進度？這個動作無法復原。</p>
          <button className="danger" onClick={resetProgress}>
            確定清除
          </button>
          <button className="text-button" onClick={() => setConfirming(false)}>
            取消
          </button>
        </div>
      ) : (
        <button className="text-button danger-text" onClick={() => setConfirming(true)}>
          重設所有進度
        </button>
      )}
      <p role="status" className="status-message">
        {message}
      </p>
    </section>
  );
}
