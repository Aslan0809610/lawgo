import { describe, expect, it } from 'vitest';
import { COURSE_PREFERENCE_KEY, createCoursePreference } from './coursePreference';

function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

describe('course preference', () => {
  it('remembers switching after recreating the store and handles removed courses', () => {
    const storage = memory();
    const preference = createCoursePreference(storage);
    const ids = ['patent', 'us-patent'];
    expect(preference.read(ids)).toBe('patent');
    preference.remember('us-patent');
    expect(storage.getItem(COURSE_PREFERENCE_KEY)).toBe('us-patent');
    expect(createCoursePreference(storage).read(ids)).toBe('us-patent');
    expect(preference.read(['patent'])).toBe('patent');
    expect(preference.read([])).toBeUndefined();
  });
  it('keeps navigation available when localStorage throws', () => {
    const preference = createCoursePreference({
      getItem() {
        throw new Error('blocked');
      },
      setItem() {
        throw new Error('blocked');
      },
    });
    expect(preference.read(['patent', 'us-patent'])).toBe('patent');
    expect(() => preference.remember('us-patent')).not.toThrow();
  });
});
