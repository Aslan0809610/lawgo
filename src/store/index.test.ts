import { describe, expect, it } from 'vitest';
import { addXp, key, scheduleReview } from '../engine';
import { createProgressStore, emptyProgress, parseProgress, STORAGE_KEY } from './index';
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
}
describe('versioned progress store', () => {
  it('persists and restores progress with an injected clock', () => {
    const storage = memory();
    const clock = { now: () => new Date(2026, 0, 1, 23, 59) };
    const store = createProgressStore(storage, clock);
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.update((p, now) => addXp(p, 15, now));
    expect(calls).toBe(1);
    expect(store.getSnapshot().dailyXp['2026-01-01']).toBe(15);
    expect(createProgressStore(storage).getSnapshot()).toEqual(store.getSnapshot());
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!)).toHaveProperty('schemaVersion', 1);
    unsubscribe();
    store.update((p) => p);
    expect(calls).toBe(1);
  });
  it('exports, imports and resets all data', () => {
    const a = createProgressStore(memory());
    const b = createProgressStore(memory());
    a.update((p, now) => ({
      ...addXp(p, 20, now),
      questions: { [key('patent', 'q')]: scheduleReview(undefined, true, now) },
    }));
    b.import(a.export());
    expect(b.getSnapshot()).toEqual(a.getSnapshot());
    expect(parseProgress(b.export())).toEqual(a.getSnapshot());
    b.reset();
    expect(b.getSnapshot()).toEqual(emptyProgress());
  });
  it.each([
    { schemaVersion: 2 },
    { totalXp: -1 },
    { dailyGoal: 21 },
    { crowns: { q: 4 } },
    { questions: { q: { box: 9 } } },
    { dailyXp: { '2026-02-30': 15 } },
    { goalDays: ['not-date'] },
    { bestScores: { patent: -2 } },
    { questions: { q: { box: 1, due: '2026-11-17', attempts: 1, correct: 1, wrong: 1 } } },
  ])('rejects invalid imports without overwriting current data: %j', (patch) => {
    const store = createProgressStore(memory());
    const before = store.export();
    expect(() => store.import(JSON.stringify({ ...emptyProgress(), ...patch }))).toThrow();
    expect(store.export()).toBe(before);
  });
  it('recovers from corrupted storage and reports persistence errors', () => {
    const corrupted = createProgressStore({ getItem: () => '{bad', setItem: () => {} });
    expect(corrupted.getSnapshot()).toEqual(emptyProgress());
    expect(corrupted.getError()).toContain('無法讀取');
    const unavailable = createProgressStore({
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
    });
    unavailable.update((p, now) => addXp(p, 10, now));
    expect(unavailable.getSnapshot().totalXp).toBe(10);
    expect(unavailable.getError()).toContain('儲存空間');
  });
});

it('migrates v1 total XP to the Taiwan course and round-trips per-course XP', () => {
  const legacy: Record<string, unknown> = { ...emptyProgress(), totalXp: 35 };
  delete legacy.courseXp;
  expect(parseProgress(JSON.stringify(legacy)).courseXp).toEqual({ patent: 35 });
  const progress = { ...emptyProgress(), totalXp: 50, courseXp: { patent: 35, 'us-patent': 15 } };
  expect(parseProgress(JSON.stringify(progress))).toEqual(progress);
  expect(() => parseProgress(JSON.stringify({ ...progress, courseXp: { patent: -1 } }))).toThrow();
});
