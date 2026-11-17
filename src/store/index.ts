import { useSyncExternalStore } from 'react';
import { systemClock } from '../engine';
import type { Clock, Progress } from '../types';
import { emptyProgress, parseProgress, STORAGE_KEY } from './serialization';

export { emptyProgress, parseProgress, STORAGE_KEY } from './serialization';

export function createProgressStore(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  clock: Clock = systemClock,
) {
  let current = emptyProgress();
  let error = '';
  const listeners = new Set<() => void>();
  try {
    const json = storage.getItem(STORAGE_KEY);
    if (json) current = parseProgress(json);
  } catch {
    error = '無法讀取已存進度；目前使用暫存進度，可至「我的」匯入備份。';
  }
  return {
    clock,
    getSnapshot: () => current,
    getError: () => error,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(transform: (progress: Progress, now: Date) => Progress) {
      current = transform(current, clock.now());
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(current));
        error = '';
      } catch {
        error = '儲存空間無法使用，請匯出備份以保存這次進度。';
      }
      listeners.forEach((l) => l());
    },
    export: () => JSON.stringify(current, null, 2),
    import(json: string) {
      const parsed = parseProgress(json);
      this.update(() => parsed);
    },
    reset() {
      this.update(() => emptyProgress());
    },
  };
}
const storage: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: (k) => window.localStorage.getItem(k),
  setItem: (k, v) => window.localStorage.setItem(k, v),
};
export const progressStore = createProgressStore(storage);
export function useProgress(): Progress {
  return useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot);
}
