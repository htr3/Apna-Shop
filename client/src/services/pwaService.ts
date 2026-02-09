/**
 * PWA Registration Service
 * Handles service worker registration and offline syncing
 */

interface OfflineQueueItem {
  id: string;
  method: string;
  endpoint: string;
  body?: any;
  timestamp: number;
}

class PWAService {
  private offlineQueue: OfflineQueueItem[] = [];
  private db: IDBDatabase | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.initDB();
    this.setupEventListeners();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private initDB() {
    const request = indexedDB.open("ShopkeeperInsights", 1);

    request.onerror = () => {
      console.error("Failed to open IndexedDB");
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("offlineQueue")) {
        db.createObjectStore("offlineQueue", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("cachedData")) {
        db.createObjectStore("cachedData", { keyPath: "endpoint" });
      }
    };

    request.onsuccess = () => {
      this.db = request.result;
      this.loadOfflineQueue();
    };
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers not supported");
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        { scope: "/" }
      );

      console.log("Service Worker registered successfully", registration);

      // Handle updates
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.onstatechange = () => {
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              console.log("New Service Worker activated");
            }
          };
        }
      };

      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  /**
   * Check if app is online
   */
  isAppOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Queue a request for offline syncing
   */
  async queueRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<string> {
    const id = `${method}-${endpoint}-${Date.now()}`;
    const item: OfflineQueueItem = {
      id,
      method,
      endpoint,
      body,
      timestamp: Date.now(),
    };

    this.offlineQueue.push(item);

    // Store in IndexedDB
    if (this.db) {
      const store = this.db
        .transaction("offlineQueue", "readwrite")
        .objectStore("offlineQueue");
      store.add(item);
    }

    return id;
  }

  /**
   * Load offline queue from IndexedDB
   */
  private loadOfflineQueue() {
    if (!this.db) return;

    const store = this.db
      .transaction("offlineQueue", "readonly")
      .objectStore("offlineQueue");
    const request = store.getAll();

    request.onsuccess = () => {
      this.offlineQueue = request.result;
    };
  }

  /**
   * Sync offline data when back online
   */
  private async syncOfflineData() {
    if (this.offlineQueue.length === 0) return;

    console.log(`Syncing ${this.offlineQueue.length} offline requests`);

    for (const item of this.offlineQueue) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          // Remove from queue
          this.removeFromQueue(item.id);
        }
      } catch (error) {
        console.error(`Failed to sync request ${item.id}:`, error);
      }
    }
  }

  /**
   * Remove item from queue
   */
  private removeFromQueue(id: string) {
    this.offlineQueue = this.offlineQueue.filter((item) => item.id !== id);

    if (this.db) {
      const store = this.db
        .transaction("offlineQueue", "readwrite")
        .objectStore("offlineQueue");
      store.delete(id);
    }
  }

  /**
   * Get offline queue status
   */
  getQueueStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.offlineQueue.length,
      queue: this.offlineQueue,
    };
  }

  /**
   * Clear offline queue (after successful sync)
   */
  clearQueue() {
    this.offlineQueue = [];

    if (this.db) {
      const store = this.db
        .transaction("offlineQueue", "readwrite")
        .objectStore("offlineQueue");
      store.clear();
    }
  }
}

export const pwaService = new PWAService();
