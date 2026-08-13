"use client";

// Simple wrapper around native IndexedDB for offline storage
const DB_NAME = "eduos_offline_db";
const DB_VERSION = 1;

export async function openDB() {
  if (typeof window === "undefined") return null;

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("artifacts")) {
        db.createObjectStore("artifacts", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("syncQueue")) {
        db.createObjectStore("syncQueue", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveArtifactOffline(artifact: any) {
  const db = await openDB();
  if (!db) return;
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction("artifacts", "readwrite");
    const store = tx.objectStore("artifacts");
    const req = store.put(artifact);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getArtifactOffline(id: string) {
  const db = await openDB();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("artifacts", "readonly");
    const store = tx.objectStore("artifacts");
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Queue for actions performed while offline (e.g. submitting a quiz)
export async function queueOfflineAction(actionType: string, payload: any) {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const req = store.add({ actionType, payload, timestamp: Date.now() });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncQueue() {
  const db = await openDB();
  if (!db) return [];

  return new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readonly");
    const store = tx.objectStore("syncQueue");
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncQueueItem(id: number) {
  const db = await openDB();
  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db.transaction("syncQueue", "readwrite");
    const store = tx.objectStore("syncQueue");
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}
