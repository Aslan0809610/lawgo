export const COURSE_PREFERENCE_KEY = 'lawgo:last-course';

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function preferredCourseId(ids: string[], remembered: string | null): string | undefined {
  return remembered && ids.includes(remembered) ? remembered : ids[0];
}

export function createCoursePreference(storage: PreferenceStorage) {
  return {
    read(ids: string[]) {
      try {
        return preferredCourseId(ids, storage.getItem(COURSE_PREFERENCE_KEY));
      } catch {
        return preferredCourseId(ids, null);
      }
    },
    remember(id: string) {
      try {
        storage.setItem(COURSE_PREFERENCE_KEY, id);
      } catch {
        // Navigation remains available when browser storage is disabled.
      }
    },
  };
}

export const coursePreference = createCoursePreference({
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
});
