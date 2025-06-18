export type Unsubscribe = () => void;

export class Cleanup {
  subscriptions = new Map<string, Unsubscribe>();

  track(key: string, unsubscribe: Unsubscribe) {
    if (!key) {
      key = Math.random().toString(32).slice(2);
    }
    if (this.subscriptions.has(key)) {
      console.warn(`Subscription with key ${key} already exists`);
    }

    this.subscriptions.set(key, unsubscribe);
  }

  close(keys: string | string[]) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }

    for (const key of keys) {
      const unsubscribe = this.subscriptions.get(key);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(key);
      } else {
        console.warn(`Listener with key ${key} not found`);
      }
    }
  }

  closeAll() {
    for (const unsubscribe of this.subscriptions.values()) {
      unsubscribe();
    }

    this.subscriptions.clear();
  }
}
