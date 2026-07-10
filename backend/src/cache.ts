// Tiny in-memory TTL cache. Used to memoize wallet metrics (see service.ts) so
// a burst of profiles — especially compare_wallets, which fans out to several
// wallets at once — does not re-issue the ~12 upstream X Layer calls per wallet
// and trip the rate limiter. Single-process (pm2) app, so a plain Map is enough.
export class TtlCache<V> {
  private store = new Map<string, { value: V; expiresAt: number }>();

  constructor(
    private readonly ttlMs: number,
    // Hard cap so a long-running process can't grow unbounded. When exceeded,
    // the oldest-inserted entries are evicted first (Map preserves order).
    private readonly maxEntries = 5000
  ) {}

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: V): void {
    // Re-insert so the freshest key moves to the end of the iteration order.
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    this.evictIfNeeded();
  }

  private evictIfNeeded(): void {
    if (this.store.size <= this.maxEntries) return;
    for (const key of this.store.keys()) {
      this.store.delete(key);
      if (this.store.size <= this.maxEntries) break;
    }
  }

  get size(): number {
    return this.store.size;
  }
}
