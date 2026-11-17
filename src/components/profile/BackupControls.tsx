import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { localDate } from '../../engine';
import { parseProgress, progressStore } from '../../store';

function downloadBackup() {
  const blob = new Blob([progressStore.export()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lawgo-${localDate(progressStore.clock.now())}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function BackupControls() {
  const [message, setMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<string | null>(null);

  function exportBackup() {
    downloadBackup();
    setMessage('備份已匯出，請妥善保存下載的 JSON 檔。');
  }

  async function readBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setPendingImport(null);
    try {
      const text = await file.text();
      parseProgress(text);
      setPendingImport(text);
      setMessage('備份格式正確。確認後將取代這台裝置目前的進度。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '讀取備份失敗。');
    } finally {
      input.value = '';
    }
  }

  function confirmImport() {
    if (pendingImport === null) return;
    progressStore.import(pendingImport);
    setPendingImport(null);
    setMessage('進度已匯入。');
  }

  return (
    <section className="settings-card">
      <h2>進度備份</h2>
      <p>進度保存在這台裝置。定期匯出，就能換裝置繼續學習。</p>
      <button className="secondary" onClick={exportBackup}>
        ↓ 匯出進度 JSON
      </button>
      <label className="secondary file-button">
        ↑ 匯入進度 JSON
        <input
          type="file"
          accept=".json,application/json"
          aria-label="匯入進度 JSON"
          onChange={readBackup}
        />
      </label>
      {pendingImport && (
        <div className="confirm-box">
          <p>匯入將取代目前進度。建議先匯出備份。</p>
          <button className="primary" onClick={confirmImport}>
            確認匯入
          </button>
          <button className="text-button" onClick={() => setPendingImport(null)}>
            取消
          </button>
        </div>
      )}
      <p role="status" className="status-message">
        {message}
      </p>
    </section>
  );
}
