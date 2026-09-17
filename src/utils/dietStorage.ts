import { NutritionItem, PortionModifier, StampTemplate, AspectRatio, PhotoTransform } from '../types/diet';

export interface SavedDietRecord {
  id: string;
  timestamp: number;
  dateStr: string;     // e.g. "2026.09.16 12:30"
  timeStr: string;     // e.g. "12:30"
  dateKey: string;     // e.g. "2026-09-16"
  imageSrc: string;    // Base64 Data URL
  nutrition: NutritionItem;
  portion: PortionModifier;
  template: StampTemplate;
  aspectRatio: AspectRatio;
  photoTransform?: PhotoTransform; // 줌 확대/이동(자르기) 구도 설정 저장
}

const DB_NAME = 'DietSnapDB';
const DB_VERSION = 1;
const STORE_NAME = 'diet_records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('dateKey', 'dateKey', { unique: false });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

// 1. 식단 레코드 저장 또는 갱신
export async function saveDietRecord(record: SavedDietRecord): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB, fallback to localStorage', err);
    // 폴백: LocalStorage 용량 초과(5MB) 방지를 위해 최근 3개만 보관
    try {
      const raw = localStorage.getItem('dietsnap_history_backup') || '[]';
      const list: SavedDietRecord[] = JSON.parse(raw);
      const filtered = list.filter((item) => item.id !== record.id);
      filtered.unshift(record);
      // 최대 3개로 제한하여 QuotaExceeded 방어
      localStorage.setItem('dietsnap_history_backup', JSON.stringify(filtered.slice(0, 3)));
    } catch (fallbackErr) {
      console.warn('LocalStorage quota limit reached, ignoring fallback save:', fallbackErr);
    }
  }
}

// 2. 모든 식단 레코드 최신순으로 가져오기
export async function getAllDietRecords(): Promise<SavedDietRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const req = index.openCursor(null, 'prev'); // 최신순

      const results: SavedDietRecord[] = [];
      req.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Failed to load from IndexedDB, trying localStorage fallback', err);
    try {
      const raw = localStorage.getItem('dietsnap_history_backup');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

// 3. 특정 식단 레코드 삭제
export async function deleteDietRecord(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = (e: any) => reject(e.target.error);
    });
  } catch (err) {
    console.error('Failed to delete record from IndexedDB', err);
  }
}
